# ThesisHub — Implemented REST API

**Base:** `http://localhost:3000/api` (development). JSON responses. Protected writes require `Authorization: Bearer <JWT>`.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | API status |
| GET | `/health/db` | No | PostgreSQL connectivity |
| POST | `/auth/register` | No | Register username/email/password |
| POST | `/auth/login` | No | Return JWT and public user profile |
| GET | `/auth/me` | Yes | Resolve current account |
| GET | `/posts` | No | Search/sort latest posts |
| GET | `/posts/:id` | No | Get one post |
| POST | `/posts` | Yes | Create thesis |
| PATCH | `/posts/:id` | Owner | Partially update thesis |
| DELETE | `/posts/:id` | Owner | Delete thesis and dependent interactions |
| GET | `/market/:ticker` | No | Yahoo quote and optional target calculation |
| GET | `/market/usage` | No | In-process cache/provider counters |
| GET | `/posts/:postId/reactions` | No | Counts and authenticated user's reaction, if JWT supplied |
| PUT | `/posts/:postId/reaction` | Yes | Create/replace sentiment |
| DELETE | `/posts/:postId/reaction` | Yes | Remove own sentiment |
| GET | `/posts/:postId/replies` | No | Replies, usernames and revision history |
| POST | `/posts/:postId/reply` | Yes | Create own single reply |
| PATCH | `/posts/:postId/reply` | Yes | Edit own reply and save previous text |
| DELETE | `/posts/:postId/reply` | Yes | Delete own reply and revision history |

## Account requests

`POST /auth/register`: `{ "username": "sample_user", "email": "sample@example.com", "password": "at-least-12-characters" }`. Username 3–30 lowercase letters/digits/underscores; valid email; password at least 12 characters and at most 72 UTF-8 bytes. Registration returns `201 { user }` and does **not** log the user in.

`POST /auth/login`: `{ "email": "...", "password": "..." }`; response `{ "token": "...", "user": { "id": "...", "username": "...", "email": "..." } }`. Token expires in two hours. `GET /auth/me` returns `{ user }`.

## Thesis payload

```json
{
  "title": "Why the company may outperform",
  "conviction": "HIGH",
  "stocks": [{ "ticker": "MSFT", "companyName": "Microsoft" }],
  "fullThesis": "Optional longer discussion",
  "priceTarget": "450.00",
  "timeHorizon": "LONG_TERM",
  "targetTimeframe": "2027-09-01",
  "catalysts": "Product launches",
  "invalidation": "Revenue decline",
  "strategy": "Shares",
  "strategyReason": "Long holding period",
  "mainRisks": "Competition",
  "marketMissing": "Undervalued margin growth",
  "counterThesis": "Demand may slow"
}
```

Required: single-line nonempty title (max 180 chars), conviction `LOW`/`MEDIUM`/`HIGH`, 1–10 distinct tickers with company names. The API enforces **one line**, not a semantic sentence classifier.

Optional numeric `priceTarget` is a **positive decimal string** with up to four fractional digits and applies only to the first ticker. `timeHorizon` is `SHORT_TERM`, `MEDIUM_TERM`, `LONG_TERM`; `targetTimeframe` is `YYYY-MM-DD`. Other optional detail fields accept bounded text. On PATCH, omitted keys remain unchanged; null/empty values clear optional fields.

Response to POST: `201 { "post": ... }`. A post contains an ordered `stocks` array, `author`, and optional `priceAtPublication` / `priceCapturedAt`. Snapshot values can be null if the upstream quote was unavailable. PATCH returns `{ post }`; DELETE returns 204 with no body.

## Public discovery

`GET /posts?q=MSFT&author=alice&conviction=HIGH&sentiment=BULLISH&age=30d&sort=popular`

All filters are optional. `q` searches **ticker or company name**, not thesis text. `age`: `all`, `7d`, `30d`, `90d`, `365d`. `sort`: `newest`, `oldest`, `popular`, `discussed`. Response: `{ posts: [...] }`, up to 25 results. `popularityScore = reactionCount + 5 * replyCount`. Popular sorts only the 200 newest matching candidates. Invalid filters return 400.

## Market quote

`GET /market/MSFT?target=450.00` returns `ticker`, `price`, `currency`, `companyName`, `priceTime`, `fetchedAt`, `cached`, `stale`, optional `priceTarget`, and `upsidePercent` = `(target / price - 1) × 100` (rounded to two decimal places). Market-data failure returns 503 when no usable cache exists. Prices may be delayed.

## Reactions and replies

`PUT /posts/:postId/reaction`: `{ "type": "BULLISH" }`; possible enum values `ROCKET`, `BULLISH`, `NEUTRAL`, `BEARISH`, `BAG_HOLDER`. One reaction per user/post.

`POST/PATCH /posts/:postId/reply`: `{ "content": "My reasoning" }`; nonempty, max 3000 characters. GET returns `{ replies: [...] }`, each with `user`, `content`, timestamps and `revisions`. History contains previous versions only. A second POST on the same post by the same user returns 409.

## Errors and observability

Common status codes: 400 invalid input, 401 missing/invalid token, 403 another author's post, 404 missing resource, 409 duplicate, 413 oversized JSON body, 429 rate limiting, 500 unexpected backend error, 503 upstream or database unavailable. Errors use `{ "error": "..." }`. Every API response includes `X-Request-ID` for log correlation. Invalid JSON receives a JSON 400 instead of a stack trace.

No public deployment is configured.
