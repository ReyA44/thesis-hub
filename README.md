# ThesisHub

**A local-first full-stack course project for publishing and discussing structured stock-investment theses.**

ThesisHub lets registered users publish an investment idea with a conviction rating, one or more tickers and optional detailed reasoning. Anyone can read the common feed, view market context, browse reactions and read replies. Editing, deleting and reacting require authentication.

## Implemented MVP

- Registration/login with bcrypt password hashes, short-lived JWTs and author-only updates
- Create, edit and delete investment theses with optional horizon, catalysts, risks, strategy, invalidation criteria and counter-thesis
- Multi-ticker posts; first ticker is primary for charts and price targets
- Market quote from Yahoo Finance (cached for 24 hours), optional price-at-publication snapshot, and lazy-loaded TradingView YTD/1Y charts
- Five mutually exclusive sentiment reactions
- One editable reply per user per thesis, with publicly visible reply revision history
- Public feed with ticker/company and author search; conviction, sentiment and age filters; newest/oldest/popular/discussed sorting
- Request IDs, JSON access logs, input validation, rate limits, and automated unit/integration checks

## Tech stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19, Vite | Forms, feed and interactive UI |
| API | Node.js, Express 5 | REST endpoints and validation |
| Database | PostgreSQL 17, Prisma 6 | Relational persistence and migrations |
| Authentication | bcrypt, JWT | Password hashing and signed session tokens |
| External services | yahoo-finance2, TradingView embed | Quotes and stock charts |
| Tooling | Docker Compose, GitHub Actions, Git | Local database and quality checks |

## Run locally

Prerequisites: **Node.js 22+**, npm, Docker and Docker Compose.

1. Clone this repository, or update your local `master` with `git pull --ff-only origin master`.
2. Copy the example environment file: `cp server/.env.example server/.env`. Edit **POSTGRES_PASSWORD**, **DATABASE_URL** (matching the password and port 5433) and **JWT_SECRET** (at least 24 random characters). Keep `.env` private.
3. Start PostgreSQL in the repository root: `docker compose up -d`.
4. From `server/`: `npm ci`, `npx prisma migrate deploy`, then `npm run dev`. The API runs at **http://localhost:3000**.
5. In a second terminal, from `client/`: `npm ci`, then `npm run dev`. Open **http://localhost:5173**.

The frontend defaults to `http://localhost:3000`; optional `client/.env` can set `VITE_API_URL`. The backend defaults `CLIENT_ORIGIN` to `http://localhost:5173`.

To verify the backend: `http://localhost:3000/api/health` and `http://localhost:3000/api/health/db`. The second endpoint checks PostgreSQL connectivity.

## Tests

- From `server/`, run `npm test` for lightweight unit tests.
- GitHub Actions additionally provisions a disposable PostgreSQL database, applies Prisma migrations, runs real HTTP integration tests (`npm run test:integration`), then frontend lint/build.
- The integration suite **refuses to run without** `TEST_DATABASE_URL` pointing to a database whose name ends in `_test`. Never point it to development or production data.
- From `client/`, run `npm run lint` and `npm run build`.
- Complete the manual browser checklist in [docs/testing.md](docs/testing.md) before the presentation.

## Documentation map

- [Requirements and scope](docs/requirements.md) — implemented vs deferred features
- [Architecture and design decisions](docs/architecture.md) — data flow, ERD, key modules
- [API reference](docs/api.md) — exact implemented endpoints and data shapes
- [Testing guide](docs/testing.md) — automated coverage and browser walkthrough
- [Presentation guide](docs/presentation-guide.md) — how to explain and demonstrate the system
- [AI-assisted development](docs/ai-usage.md) — tools, boundaries, verification
- [Development workflow](docs/workflow.md) — issues, branches and PRs
- [Deployment notes](docs/deployment.md) — optional future work; **public hosting is not part of this submission**

## Known MVP limitations

- The feed shows a maximum of 25 posts. Popular sorting considers at most the latest 200 matching records; there is no pagination.
- Tags, supporting-source entities, target-upside filtering and a dedicated post page are deferred.
- A publication-price snapshot is stored only if a fresh quote is available. It uses the *last market observation*, not necessarily a trade at the exact posting second. Older posts are not backfilled.
- JWTs live only in React memory; refreshing the browser logs the user out. Session tokens expire after two hours.
- The in-memory quote cache and rate limits are appropriate to a single local app process.
- Yahoo Finance is an unofficial data source; public distribution and commercial use require a separate licensing review.

**Project goal:** a demonstrable, understandable, reliable *local MVP*, not a production brokerage or investment-advice application.
