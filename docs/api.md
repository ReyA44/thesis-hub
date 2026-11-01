
# ThesisHub — API Documentation

Base URL: `http://localhost:3000`

## Health Checks

| Method | Endpoint | Description | Success |
|---|---|---|---|
| GET | /api/health | Check Express server | 200 |
| GET | /api/health/db | Check PostgreSQL connection | 200 |

## Authentication

### POST /api/auth/register

Create a new account.

Request body:
```json
{
  "username": "demo_user",
  "email": "demo@example.com",
  "password": "example-password-123!"
}
```

Responses:
- 201 Created — Account created successfully.
- 400 Bad Request — Invalid registration input.
- 409 Conflict — Username or email already exists.
- 500 Internal Server Error — Unexpected server failure.

The response never includes the password or password hash.

### POST /api/auth/login

Authenticate an existing user.

Request body:
```json
{
  "email": "demo@example.com",
  "password": "example-password-123!"
}
```

Responses:
- 200 OK — Returns JWT and public user information.
- 400 Bad Request — Missing or invalid input types.
- 401 Unauthorized — Invalid credentials.
- 500 Internal Server Error — Unexpected server failure.

JWT lifetime: 2 hours.

### GET /api/auth/me

Retrieve the authenticated user's profile.

Required header:
`Authorization: Bearer <token>`

Responses:
- 200 OK — Returns public account information.
- 401 Unauthorized — Missing, invalid, or expired token.
- 500 Internal Server Error — Unexpected server failure.

## Security Notes

- Passwords are hashed using bcrypt.
- JWTs are signed using a secret stored in server/.env.
- Protected endpoints verify JWT signatures and expiration.
- Password hashes and signing secrets are never returned.
- Logout currently means discarding the JWT on the client.
- Production deployment will require further security hardening.


## Investment Theses

### POST /api/posts

Create an investment thesis.

Authentication: Required (Bearer JWT).

Required fields:
- `title`: Single-line string (1-180 characters)
- `conviction`: LOW, MEDIUM, or HIGH
- `stocks`: Array of 1-10 stocks, each with ticker and companyName

Optional fields:
- `fullThesis`: Detailed analysis (up to 10,000 characters)
- `priceTarget`: Positive decimal string

Example request:

```json
{
  "title": "Microsoft may benefit from enterprise AI demand",
  "conviction": "HIGH",
  "stocks": [
    {"ticker": "MSFT", "companyName": "Microsoft"},
    {"ticker": "NVDA", "companyName": "NVIDIA"}
  ],
  "fullThesis": "A sample investment thesis.",
  "priceTarget": "650.00"
}
```

Responses:
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 500 Internal Server Error

The first stock is the primary ticker.

### GET /api/posts

Retrieve the public thesis feed.

Authentication: Not required.

Returns up to 25 posts, newest first, including
author information and ordered stock tickers.

Response: 200 OK.

### GET /api/posts/:id

Retrieve an individual thesis by its ID.

Authentication: Not required.

Responses:
- 200 OK — Thesis found
- 404 Not Found — Thesis does not exist
- 500 Internal Server Error
```
