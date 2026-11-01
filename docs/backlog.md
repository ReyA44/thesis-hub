# ThesisHub — Roadmap and backlog

The **local MVP is implemented**. The items below are **not shipped**; they are tracked for later work. Priorities reflect a possible small friends-and-family beta, not a commitment to launch.

## P0 — Required before inviting friends

| Workstream | Why it matters | GitHub issue |
|---|---|---|
| Deploy a small private beta with HTTPS | A repeatable, secured way for friends to access the app | [#45](https://github.com/ReyA44/thesis-hub/issues/45) |
| Review market-data/widget rights and select the project license | Access to public quotes/charts does not itself grant redistribution rights | [#46](https://github.com/ReyA44/thesis-hub/issues/46) |
| Account lifecycle and privacy | Password recovery, account/data deletion, transparent data use | [#47](https://github.com/ReyA44/thesis-hub/issues/47) |
| Basic moderation and abuse/security review | Multi-user posting requires report/removal and anti-spam safeguards | [#48](https://github.com/ReyA44/thesis-hub/issues/48) |
| Backups, monitoring and browser acceptance | Recover from outages, verify responsive UX and capture genuine screenshots | [#49](https://github.com/ReyA44/thesis-hub/issues/49) |

**Suggested sequence:** resolve data-rights/privacy decisions → design beta hosting → implement safeguards and backups → verify real browser flows → invite a few friends. Start with the smallest workable beta; do not add production infrastructure purely for appearance.

## P1 — Deferred product functionality

| Feature | Current limitation | GitHub issue |
|---|---|---|
| Pagination and full feed ranking | Only 25 results; popular uses the newest 200 matching candidates | [#50](https://github.com/ReyA44/thesis-hub/issues/50) |
| Shareable thesis pages, structured supporting sources, tags, and upside/downside filter | Inline feed only; no dedicated source/tag entities or target-gap filtering | [#51](https://github.com/ReyA44/thesis-hub/issues/51) |

## P2 — Optional longer-term ideas

| Feature | GitHub issue |
|---|---|
| Author profiles, following, notifications and possible leaderboards | [#52](https://github.com/ReyA44/thesis-hub/issues/52) |
| Dated catalysts, post-edit history, optional thesis-performance tracking | [#53](https://github.com/ReyA44/thesis-hub/issues/53) |

## Scope principles

- Prefer plain React, Express, Prisma and PostgreSQL; introduce new tools only when a concrete requirement justifies them.
- Keep user financial accounts/portfolio credentials out of scope.
- Add automated tests and explain behavior for each implemented feature.
- Treat the README as a description of **what works today**; this file records **what might come next**.
- The [GitHub Issues page](https://github.com/ReyA44/thesis-hub/issues) is the actionable source of truth for open work.
