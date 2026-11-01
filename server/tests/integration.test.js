/**
 * Real HTTP + PostgreSQL integration test. Uses only a disposable database
 * explicitly named *_test. Never run against the development database.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith("_test")) {
    throw new Error("Set TEST_DATABASE_URL to a disposable PostgreSQL database named *_test.");
}
process.env.DATABASE_URL = databaseUrl;
process.env.JWT_SECRET = process.env.JWT_SECRET || "integration-tests-not-a-real-secret-123";

const { createApp } = await import("../src/app.js");
const { createPostsRouter } = await import("../src/routes/posts.js");
const { prisma } = await import("../src/db.js");

test("HTTP API: auth, posts, permission checks, sentiment, reply revisions, discovery", async () => {
    const fixedQuote = async () => ({
        price: 100, priceTime: "2026-10-30T16:00:00.000Z", stale: false,
    });
    const server = createApp({
        postsRouter: createPostsRouter({ publicationQuoteLookup: fixedQuote }),
    }).listen(0);
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;

    const unique = randomUUID().replaceAll("-", "").slice(0, 14);
    const users = [];
    let postId;
    async function api(method, path, body, token) {
        const res = await fetch(base + path, {
            method,
            headers: {
                ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            ...(body !== undefined ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
        });
        const data = res.status === 204 ? null : await res.json();
        assert.ok(res.headers.get("x-request-id"), "Request ID must be returned");
        return { status: res.status, data };
    }
    try {
        let result = await api("GET", "/api/health/db");
        assert.equal(result.status, 200);

        const register = async (suffix, password = "verysecurepassword123!") => {
            const email = `${unique}${suffix}@example.test`;
            const response = await api("POST", "/api/auth/register", {
                username: `user_${unique}${suffix}`, email, password,
            });
            assert.equal(response.status, 201);
            users.push(response.data.user.id);
            return { email, id: response.data.user.id };
        };
        const u1 = await register("a");
        const u2 = await register("b");
        const u3 = await register("c", "a".repeat(72));
        assert.equal((await api("POST", "/api/auth/register", {
            username: `user_${unique}a`, email: u1.email, password: "verysecurepassword123!",
        })).status, 409);

        const login = async (email) => {
            const response = await api("POST", "/api/auth/login", {
                email, password: "verysecurepassword123!",
            });
            assert.equal(response.status, 200);
            return response.data.token;
        };
        const token1 = await login(u1.email);
        const token2 = await login(u2.email);
        // A 72-byte bcrypt password must reject any appended bytes.
        assert.equal((await api("POST", "/api/auth/login", {
            email: u3.email, password: "a".repeat(72) + "extra",
        })).status, 401);
        assert.equal((await api("POST", "/api/auth/login", {
            email: u3.email, password: "a".repeat(72),
        })).status, 200);
        assert.equal((await api("GET", "/api/auth/me")).status, 401);
        assert.equal((await api("GET", "/api/auth/me", undefined, token1)).status, 200);
        assert.equal((await api("POST", "/api/auth/login", {
            email: u1.email, password: "incorrect-password",
        })).status, 401);

        const thesis = {
            title: "A profitable company with a durable advantage",
            conviction: "HIGH", stocks: [{ ticker: "MSFT", companyName: "Microsoft" }],
            priceTarget: "150", timeHorizon: "LONG_TERM", catalysts: "New releases",
        };
        assert.equal((await api("POST", "/api/posts", thesis)).status, 401);
        result = await api("POST", "/api/posts", thesis, token1);
        assert.equal(result.status, 201);
        postId = result.data.post.id;
        assert.equal(Number(result.data.post.priceAtPublication), 100);
        assert.equal(result.data.post.catalysts, "New releases");
        assert.equal((await api("GET", "/api/posts?sort=newest&q=MSFT")).data.posts[0].id, postId);
        assert.equal((await api("PATCH", `/api/posts/${postId}`, { title: "Hijack" }, token2)).status, 403);
        assert.equal((await api("PATCH", `/api/posts/${postId}`, { timeHorizon: "UNKNOWN" }, token1)).status, 400);
        result = await api("PATCH", `/api/posts/${postId}`, { catalysts: "Earnings" }, token1);
        assert.equal(result.status, 200);
        assert.equal(result.data.post.catalysts, "Earnings");
        assert.equal(Number(result.data.post.priceAtPublication), 100);

        // Editing associated stocks without changing the primary ticker preserves the snapshot.
        result = await api("PATCH", `/api/posts/${postId}`, {
            stocks: [
                { ticker: "MSFT", companyName: "Microsoft" },
                { ticker: "AAPL", companyName: "Apple" },
            ],
        }, token1);
        assert.equal(result.status, 200);
        assert.equal(Number(result.data.post.priceAtPublication), 100);
        assert.equal(result.data.post.priceCapturedAt, "2026-10-30T16:00:00.000Z");

        // Reordering makes AAPL primary; the old MSFT publication snapshot must be removed.
        result = await api("PATCH", `/api/posts/${postId}`, {
            stocks: [
                { ticker: "AAPL", companyName: "Apple" },
                { ticker: "MSFT", companyName: "Microsoft" },
            ],
        }, token1);
        assert.equal(result.status, 200);
        assert.equal(result.data.post.stocks[0].stock.ticker, "AAPL");
        assert.equal(result.data.post.priceAtPublication, null);
        assert.equal(result.data.post.priceCapturedAt, null);

        assert.equal((await api("PUT", `/api/posts/${postId}/reaction`, { type: "ROCKET" }, token2)).status, 200);
        assert.equal((await api("PUT", `/api/posts/${postId}/reaction`, { type: "BULLISH" }, token2)).status, 200);
        result = await api("GET", `/api/posts/${postId}/reactions`, undefined, token2);
        assert.equal(result.data.total, 1);
        assert.equal(result.data.myReaction, "BULLISH");

        assert.equal((await api("POST", `/api/posts/${postId}/reply`, { content: "First view" }, token2)).status, 201);
        assert.equal((await api("POST", `/api/posts/${postId}/reply`, { content: "Another" }, token2)).status, 409);
        assert.equal((await api("PATCH", `/api/posts/${postId}/reply`, { content: "Reconsidered" }, token2)).status, 200);
        result = await api("GET", `/api/posts/${postId}/replies`);
        assert.equal(result.data.replies[0].content, "Reconsidered");
        assert.equal(result.data.replies[0].revisions[0].content, "First view");

        assert.equal((await api("DELETE", `/api/posts/${postId}`, undefined, token2)).status, 403);
        assert.equal((await api("DELETE", `/api/posts/${postId}`, undefined, token1)).status, 204);
        assert.equal((await api("GET", `/api/posts/${postId}`)).status, 404);
        assert.equal((await api("POST", "/api/auth/login", '{"broken":')).status, 400);
        assert.equal((await api("GET", "/api/does-not-exist")).status, 404);
    } finally {
        // Cleanup is scoped to records created by this test, never global tables.
        if (postId) {
            await prisma.replyRevision.deleteMany({ where: { reply: { postId } } });
            await prisma.reply.deleteMany({ where: { postId } });
            await prisma.reaction.deleteMany({ where: { postId } });
            await prisma.postStock.deleteMany({ where: { postId } });
            await prisma.thesisPost.deleteMany({ where: { id: postId } });
        }
        if (users.length) await prisma.user.deleteMany({ where: { id: { in: users } } });
        await new Promise((resolve) => server.close(resolve));
        await prisma.$disconnect();
    }
});
