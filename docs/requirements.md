# ThesisHub — Final MVP Requirements and Scope

**Status:** Implemented local-first course MVP (pending final user browser acceptance).

## Product goal

Enable people to publish clear, structured stock-investment ideas and discuss them in a shared feed. No brokerage access, holdings or personal portfolio data are collected.

## Requirements traceability

| Requirement | Status | Implementation |
|---|---|---|
| Register, login, logout | Implemented | `auth.js`, `App.jsx`; JWT valid for 2h |
| Only authors can modify posts | Implemented | `requireAuth.js`, `posts.js` ownership checks |
| Title, conviction, primary stock | Implemented | `ThesisForm.jsx`, `posts.js` |
| Optional thesis details | Implemented | `StructuredThesisFields.jsx`, Prisma `ThesisPost` |
| Multiple tickers | Implemented | Prisma `Stock` + `PostStock` |
| Price target and upside/downside | Implemented | Primary ticker only; market quote and `MarketPanel.jsx` |
| Publication-price snapshot | Implemented conditionally | Last fresh regular-market quote at creation, or null |
| Performance since publication | Implemented conditionally | Market quote vs saved snapshot in `MarketPanel.jsx` |
| YTD / 1Y chart | Implemented | TradingView embed; user opens chart |
| Five exclusive sentiment reactions | Implemented | `Reaction` uniqueness plus `reactions.js` |
| One editable reply and visible revisions | Implemented | `Reply`, `ReplyRevision`, transactional update |
| Public feed and structured discovery | Implemented within limits | `discoverPosts.js`, `ThesisFeed.jsx` |
| Automated tests | Implemented | Node unit tests + isolated HTTP/PostgreSQL integration test in CI |
| Exception handling / logging | Implemented | Request IDs, structured HTTP logs, JSON error handling |
| Meaningful names, modular structure | Implemented, reviewable | Route/service/component modules and comments |
| Local browser verification | Pending final user walkthrough | `docs/testing.md` |

## Explicitly deferred from original brainstorm

- Tag entities and tag filters
- Structured supporting-source links
- Price-target upside/downside **filtering** (display is supported)
- Individually dated catalyst records (current catalysts are text)
- Dedicated full post page; current feed shows details inline
- Unlimited results / pagination / globally comprehensive popularity ranking
- Public deployment, hosting, dashboards, user profiles, AI thesis analysis

These are not silently claimed as completed. See [original development history](https://github.com/ReyA44/thesis-hub/pulls) for the incremental planning and PRs.

## Constraints and safety

- Free local development tooling; no sensitive financial connections
- Password hashes, never plaintext passwords
- Server-side authentication, authorization and input validation
- Secrets remain in ignored environment files
- Upstream finance quotes can be delayed or unavailable; no claim of real-time exchange-quality prices
- Unofficial Yahoo Finance usage is intended for an educational local demo
- Market content is users' opinions, not investment advice

## Definition of done

Code merged through PR with green CI, matching documentation, and a final browser walkthrough of registration, publishing, editing, filtering, reacting, replying and deleting.
