# ThesisHub — Testing and Browser Acceptance

## Automated verification

**GitHub Actions** uses Node.js 22 and PostgreSQL 17. On each PR and relevant push, it:

1. Runs `npm ci` in `server/` (Prisma Client generation).
2. Starts a disposable `thesishub_test` PostgreSQL service and runs `npx prisma migrate deploy`.
3. Runs `npm test` (pure validation and rate-limiter unit tests).
4. Runs `npm run test:integration` (real HTTP calls and real database writes).
5. Runs `npm ci`, `npm run lint`, `npm run build` in `client/`.

The integration suite creates uniquely named test accounts, tests actual HTTP routes and deletes its own records. It injects a deterministic market quote to avoid network dependence. It **will refuse to run** unless `TEST_DATABASE_URL` references a database ending in `_test`. This protects the development database.

### What is tested

- API health and database connectivity
- Registration, duplicate registration, login, failed login, protected profile
- Authenticated thesis creation and public feed search
- Publication-price snapshot and optional structured details
- Cross-user update/delete rejection; invalid field rejection
- Exclusive sentiment updates and aggregate counts
- One reply per user, updated content and public revision history
- Author delete, not-found responses, malformed JSON, request IDs
- Unit tests for optional field normalization/date validation and 429 throttling

### Not automatically proven

- Every browser interaction, visual alignment and accessibility behavior
- All market-data provider failures/rate limits and TradingView rendering
- Comprehensive penetration testing or high-load operation
- The course's precise testing coverage threshold (no coverage gate is configured)

## Final manual browser walkthrough — run after synchronizing master

Start the API, PostgreSQL and Vite as described in [README.md](../README.md). Use **only the browser**, not curl or Postman.

- [ ] The page loads at `localhost:5173`, and backend status shows connected.
- [ ] Register user A with a unique username/email. Log in.
- [ ] Create a thesis with ticker, conviction, price target and at least three advanced fields.
- [ ] It appears in the shared feed; expand the advanced details.
- [ ] Open the TradingView chart and switch YTD/1Y (third-party services may be unavailable).
- [ ] Confirm the market quote either loads or fails gracefully. If a fresh quote existed at publication, see change since publication.
- [ ] Edit title/advanced fields; verify the updated content without a hard refresh.
- [ ] Filter/search by ticker, conviction and author; reset filters; test popularity sorting.
- [ ] React with one sentiment and change it; ensure the old selection is replaced.
- [ ] Reply, edit the reply, and expand its public previous-version history.
- [ ] Log out; verify that guests can still read theses and reactions but cannot post.
- [ ] Register/log in as user B; verify user A's thesis has no edit/delete controls.
- [ ] As B, add a distinct reaction and reply. Switch back to A and confirm both are visible.
- [ ] Delete A's thesis and confirm it disappears; cancel deletion first to verify confirmation.
- [ ] Check malformed/empty form inputs show feedback without breaking the page.
- [ ] Check responsive layout and browser console for obvious errors.

These boxes intentionally start unchecked: **no automated CI result substitutes for an actual browser walkthrough**. Record any problems before the presentation.

## Local test commands

From `server/`: `npm test`. For HTTP integration, create a **separate disposable test database** and set `TEST_DATABASE_URL` to it, then apply migrations with `DATABASE_URL` pointing at that database and run `npm run test:integration`. The CI workflow is the preferred fully configured integration test environment.

From `client/`: `npm run lint` and `npm run build`.

## Troubleshooting

- Backend unavailable: confirm `npm run dev` in `server/` and `JWT_SECRET` in `server/.env`.
- Database unavailable: run `docker compose up -d`, verify local port 5433 and `DATABASE_URL`, run `npx prisma migrate deploy`.
- CORS error: match `CLIENT_ORIGIN` to the actual frontend origin.
- A quote/chart doesn't load: external services are independent of database post persistence.
- CI failures: open the failing GitHub Actions job and read its first failed step/log.
