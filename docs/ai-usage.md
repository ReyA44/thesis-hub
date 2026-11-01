# ThesisHub — AI-Assisted Development Workflow

## Tools and responsibilities

- **Antigravity IDE**: local development/editing environment.
- **Git and GitHub**: version history, issues, feature branches, pull requests, code review and Actions.
- **ChatGPT / AI assistance**: requirements brainstorming, architecture discussion, code drafting, troubleshooting, GitHub code inspection, test planning and documentation preparation.

The developer is responsible for understanding the implementation, verifying behavior in the browser, reviewing PR diffs and presenting the architecture. AI-generated text or code is **not automatically evidence of correctness**.

## Actual project workflow

1. Define an issue and acceptance criteria.
2. Work in a short-lived feature branch (or review an AI-prepared branch).
3. Compare source against Prisma schema and frontend payloads.
4. Run automated checks (Node unit tests, real HTTP + isolated PostgreSQL integration tests, frontend lint/build).
5. Fix failures reported by GitHub Actions.
6. Review and merge to `master`.
7. Run the local app and manually test core user flows.

## Examples of AI-supported engineering decisions

- Keep the MVP as a single React/Express/PostgreSQL stack, not a collection of services.
- Enforce one reply and one reaction **in PostgreSQL**, not only in frontend state.
- Put ownership checks in backend routes.
- Use an external quote API behind Express and load TradingView only when expanded.
- Add bounded discovery sorting instead of premature search infrastructure.
- Use a disposable DB and actual HTTP requests for integration tests.
- Improve traceability using request IDs and structured console logs.

## Limitations and presentation integrity

- Distinguish source-code reviews, green automated tests and genuine manual UI verification.
- Do not say AI performed browser tests it did not perform.
- Do not present unimplemented features or diagrams of hypothetical entities as part of the actual schema.
- Be ready to explain why each core dependency was selected, how requests traverse the stack and why specific shortcuts were reasonable for the course scope.
