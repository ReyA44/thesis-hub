
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
