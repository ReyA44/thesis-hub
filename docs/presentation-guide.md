# ThesisHub — Presentation and Oral Defense Guide

This guide is a **study outline**, not a claim that you have already rehearsed or completed final browser verification.

## Suggested demo flow (5–8 minutes)

1. State the problem: free-form stock tips lack structure, explicit assumptions and accountability.
2. Open the local React app. Show anonymous public feed and stock search.
3. Log in; create a thesis with primary ticker, conviction, price target, catalysts, risks and invalidation.
4. Show a cached quote and the expandable TradingView chart; explain that a quote may be unavailable and is not guaranteed real time.
5. Edit your own thesis; show that another user cannot edit it.
6. Add/switch reactions, then create and edit a reply to reveal the public history.
7. Show newest/popular sorting, the GitHub project history and one passing CI run.
8. Close with limitations and what you learned.

## Architecture in one minute

- **React/Vite:** holds UI state, renders forms/feed, sends JSON via fetch.
- **Express:** HTTP routes, validation, login, ownership enforcement and error handling.
- **Prisma/PostgreSQL:** persistent relational entities, foreign keys, composite uniqueness and transactions.
- **Third parties:** Yahoo Finance quotes via backend; TradingView embed directly in browser.
- **GitHub:** issue → feature branch → PR → CI → review → merge.

## Technical design questions to prepare for

**Why PostgreSQL rather than MongoDB?** Reactions, replies, authors and ordered stocks have explicit relationships. Foreign keys and unique composite indexes enforce key product rules.

**What is a JWT?** A signed token (HS256) containing the user's ID; `requireAuth` checks signature/expiry. We do not trust user IDs sent in request bodies.

**How does one-reaction/one-reply work?** Database uniqueness on `(userId, postId)`. Reactions use upsert; replies reject duplicates. A changed reaction updates the existing row.

**How is reply history reliable?** Prior content and update execute inside one Prisma transaction; if either fails, neither should commit.

**How is the author protected?** Protected routes require a JWT and check the post's `authorId` matches `req.userId`. UI hides actions too, but the backend is authoritative.

**Why cache market quotes?** Fewer external calls; 24-hour in-memory cache and stale fallback reduce dependence on an unofficial provider. A publication snapshot is best-effort only.

**How is popularity ranked?** `reactionCount + 5 * replyCount`. The feed uses a 200-post candidate pool for popular sorting to limit work.

**Why do tests use a separate database?** HTTP/database integration tests should verify real writes and constraints without touching users' local content. CI starts a throwaway PostgreSQL service.

**What happens on an API failure?** Express replies with an appropriate status and JSON error; request IDs correlate console logs; the React UI shows feedback.

**Why no Redux/Redis/microservices?** React component state and a single Node server are enough for the small course MVP; avoid complexity without an observed need.

**What is not implemented?** Tags, external evidence links, unlimited feed pagination, target-upside filter, public deployment and rich user-profile pages.

## Learning checklist

- [ ] Explain each Prisma model and the three most important unique constraints.
- [ ] Trace the POST request from `ThesisForm` through Express to Prisma and back to `ThesisFeed`.
- [ ] Explain the difference between authentication and authorization.
- [ ] Explain the value and limitation of in-memory JWTs and cached market quotes.
- [ ] Open `.github/workflows/ci.yml`; explain what each job tests.
- [ ] Explain your own use of Antigravity, GitHub and AI assistance, including what you personally verified.
- [ ] Practice the browser walkthrough from `docs/testing.md`.

## Presentation structure (if slides are required)

1. Problem and motivation
2. Use cases and key features
3. System architecture diagram
4. Data model and constraints
5. Demo
6. Security, testing and CI
7. Design trade-offs, limitations and lessons learned

Use real screenshots only after the final browser walkthrough; avoid claiming all test cases have been manually tested until they have.
