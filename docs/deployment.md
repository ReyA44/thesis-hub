# ThesisHub — Deployment Notes (Deferred)

**Current implementation: local-only.** Public hosting, domain configuration and live production verification are deliberately postponed. See the [sharing prerequisites](backlog.md) and linked GitHub issues. Local startup instructions are in [README.md](../README.md).

For a future public deployment, the minimum work is:

1. Obtain a licensed/authorized market-data solution suitable for public redistribution. The current Yahoo Finance integration is unofficial.
2. Provision private PostgreSQL storage, run `npx prisma migrate deploy`, and use backups.
3. Host the Express API with `DATABASE_URL`, a strong `JWT_SECRET`, `CLIENT_ORIGIN` and `PORT`.
4. Build the static React site with `VITE_API_URL` pointing to the HTTPS backend.
5. Enable HTTPS, centralized persistent logs and shared-store rate limiting if scaling beyond one process.
6. Re-run CI and an end-to-end browser acceptance test against the deployed environment.

Do not set backend secrets as Vite environment variables. The backend's CORS setting is **not** a substitute for authentication and authorization. Public hosting is **not implemented**. Do not invite testers until the [sharing prerequisites](backlog.md) are addressed.
