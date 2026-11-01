
# ThesisHub — Manual API Testing

## Prerequisites

- PostgreSQL is running via Docker Compose.
- Express is running using `npm run dev` from server/.
- A test account can be created using the registration API.

These are manual integration tests performed using curl.
They are not yet automated.

## Health Checks

| Test | Expected |
|---|---|
| GET /api/health | 200 |
| GET /api/health/db | 200 |

## Registration

| Test | Expected |
|---|---|
| Register valid new user | 201 |
| Register same user again | 409 |
| Submit invalid registration fields | 400 |
| Check response for password/hash | Neither is included |

Example:

```bash
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo_user","email":"demo@example.com","password":"example-password-123!"}'
```

Use a new username/email when repeating the successful-registration test.

## Login

| Test | Expected |
|---|---|
| Correct email and password | 200 + JWT |
| Incorrect password | 401 |
| Unknown email | 401 |

Example:

```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"example-password-123!"}'
```

## Protected Endpoint

| Test | Expected |
|---|---|
| GET /api/auth/me with valid JWT | 200 |
| GET /api/auth/me without JWT | 401 |
| GET /api/auth/me with invalid JWT | 401 |
| GET /api/auth/me with expired JWT | 401 |

Example:

```bash
# Use a token obtained from the login endpoint.
TOKEN="paste_test_token_here"

curl -i http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Never commit actual JWTs, passwords, or secrets.

## Verification History

Authentication milestone:
- Registration: passed (201, 409)
- Successful login: passed (200)
- Incorrect password: passed (401)
- Authenticated /me: passed (200)
- Missing token: passed (401)
- Expired token: passed (401)

Additional negative cases are documented for future testing.

## Future Work

- Replace manual checks with automated integration tests.
- Use an isolated testing database.
- Run tests automatically in CI.


## React Authentication UI — Manual Tests

All seven browser tests passed:

- [x] Registration creates a new account
- [x] Duplicate registration displays an error
- [x] Login succeeds with valid credentials
- [x] Incorrect password displays an error
- [x] Authenticated profile displays the correct user
- [x] Logout returns to the login screen
- [x] Refreshing the page clears the session

Note: JWTs are currently stored in React memory only.
Persistent sessions are deferred to a future milestone.


## Posts API — Manual Testing

| Test | Expected | Result |
|---|---|---|
| Retrieve public feed | 200 | Passed |
| Publish without JWT | 401 | Passed |
| Publish valid thesis with JWT | 201 | Passed |
| Retrieve published thesis in feed | 200 | Passed |
| Submit thesis with empty stocks | 400 | Passed |
| Retrieve individual thesis by ID | 200 | Passed |

Tests use the development PostgreSQL database.
Automated integration tests are deferred.


## React Thesis Publishing and Public Feed — Manual Tests

### Publishing

- [x] Authenticated user can publish a valid thesis
- [x] Required title, conviction, and stock fields are enforced
- [x] Multiple stocks can be added and removed
- [x] Duplicate tickers are rejected
- [x] Primary ticker order is preserved
- [x] Optional full thesis and price target are saved

### Public Feed

- [x] Visitors can browse posts without logging in
- [x] Newly published posts appear without a page refresh
- [x] Author, title, conviction, and stock tickers display
- [x] Optional details display correctly
- [x] Logged-out users cannot see the publishing form
- [x] Reloading the browser preserves published database records

### Regression Testing

- [x] Registration still works
- [x] Login still works
- [x] Logout still works
- [x] Backend health checks still work

### Technical Verification

- [x] npm run lint passes
- [x] npm run build passes

Testing method: manual browser testing against the
local Express API and development PostgreSQL database.

Automated integration tests remain future work.


## Milestone 7 — Post Editing and Deletion

### Backend

- [x] Author can update a thesis using PATCH.
- [x] Partial updates preserve omitted fields.
- [x] Invalid input is rejected.
- [x] Missing authentication returns 401.
- [x] Cross-user PATCH returns 403.
- [x] Cross-user DELETE returns 403.
- [x] Author can delete a thesis.
- [x] Deleting a thesis removes its related records.
- [x] Deleted thesis returns 404 when retrieved.

### Frontend

- [x] Authors see Edit and Delete controls.
- [x] Other users do not see management controls.
- [x] Editing prepopulates the existing thesis.
- [x] Edited thesis appears in the refreshed feed.
- [x] Cancel editing preserves the existing thesis.
- [x] Delete confirmation can be cancelled.
- [x] Confirmed deletion removes the thesis.
- [x] Public feed remains available without login.
- [x] Publishing new theses still works.

### Verification

- [x] `npm run lint`
- [x] `npm run build`

### Security

Authentication is enforced through JWT middleware.
Post ownership is checked on the backend, independently
of the frontend's visibility controls.
```
