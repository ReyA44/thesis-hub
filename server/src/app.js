/**
 * Express application factory. Keeping app.listen() in index.js lets
 * automated tests exercise real HTTP requests on an ephemeral port.
 */
import express from "express";
import cors from "cors";
import { prisma } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { postsRouter as defaultPostsRouter } from "./routes/posts.js";
import { marketRouter } from "./routes/market.js";
import { reactionsRouter } from "./routes/reactions.js";
import { repliesRouter } from "./routes/replies.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { requestLogger } from "./middleware/requestLogger.js";

export function createApp({ postsRouter = defaultPostsRouter } = {}) {
    const app = express();
    app.disable("x-powered-by");
    app.use(requestLogger);
    app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
    app.use(express.json({ limit: "64kb" }));

    // Small single-process safeguards against repeated requests.
    app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
    app.use("/api/market", rateLimit({ windowMs: 60 * 1000, limit: 60 }));

    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok", service: "thesis-hub-api" });
    });

    app.get("/api/health/db", async (_req, res) => {
        try {
            await prisma.user.count();
            return res.json({ status: "ok", database: "connected" });
        } catch (error) {
            console.error("Database health check failed:", error);
            return res.status(503).json({ status: "error", database: "unavailable" });
        }
    });

    app.use("/api/auth", authRouter);
    app.use("/api/posts", postsRouter);
    app.use("/api/market", marketRouter);
    app.use("/api/posts", reactionsRouter);
    app.use("/api/posts", repliesRouter);

    app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));

    // JSON parse errors should be 400, oversized bodies 413; do not leak stack traces.
    app.use((error, req, res, next) => {
        if (res.headersSent) return next(error);
        const status = error.type === "entity.parse.failed" ? 400
            : error.type === "entity.too.large" ? 413 : 500;
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "error",
            requestId: req.requestId,
            status,
            errorType: error.type || error.name || "Error",
        }));
        const message = status === 400 ? "Malformed JSON request."
            : status === 413 ? "Request body is too large."
                : "Internal server error.";
        return res.status(status).json({ error: message });
    });
    return app;
}
