# Deployment quick start (Milestone 12)

Deploy PostgreSQL and the Express server on a Node.js host; deploy `client` as a Vite static site.

## Backend environment
- `DATABASE_URL` — production PostgreSQL connection string (set privately on your host)
- `JWT_SECRET` — a long, random signing secret (never commit it)
- `CLIENT_ORIGIN` — exact HTTPS frontend origin, without a trailing slash
- `PORT` — provided by hosting service

Build/install: `cd server && npm ci && npx prisma migrate deploy`
Start: `cd server && npm start`
Health: `https://YOUR-API-HOST/api/health/db`

## Frontend environment
- `VITE_API_URL` — exact public HTTPS backend origin (without trailing slash)

Build: `cd client && npm ci && npm run build`
Publish the `client/dist` directory as a static website.

**Do not** place `DATABASE_URL` or `JWT_SECRET` in Vite variables.
The Yahoo Finance integration is unofficial; check its display and redistribution terms before using public market quotes.
The in-memory rate limiter and quote cache suit a one-instance course demo, not horizontal scaling.
