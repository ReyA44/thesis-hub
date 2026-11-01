# ThesisHub — Development history

The sequence below is based on **merged GitHub pull requests**, not a reconstructed or invented development diary. Work was organized in small feature branches and merged into `master` after review and automated checks.

| Stage | What changed | Representative PRs |
|---|---|---|
| **1. Idea and scope** | Established the investment-thesis concept, user stories, system design and local MVP boundary. | [#1](https://github.com/ReyA44/thesis-hub/pull/1), [#8](https://github.com/ReyA44/thesis-hub/pull/8), [#10](https://github.com/ReyA44/thesis-hub/pull/10) |
| **2. Stack and data model** | Initialized React/Express, PostgreSQL and Prisma models/migrations. | [#12](https://github.com/ReyA44/thesis-hub/pull/12), [#14](https://github.com/ReyA44/thesis-hub/pull/14) |
| **3. Authentication** | Implemented registration/login with bcrypt/JWT, then the frontend login/register flow. | [#16](https://github.com/ReyA44/thesis-hub/pull/16), [#18](https://github.com/ReyA44/thesis-hub/pull/18) |
| **4. Investment theses** | Added post API, create/feed UI, author edits/deletions and structured detail fields. | [#20](https://github.com/ReyA44/thesis-hub/pull/20), [#22](https://github.com/ReyA44/thesis-hub/pull/22), [#24](https://github.com/ReyA44/thesis-hub/pull/24), [#32](https://github.com/ReyA44/thesis-hub/pull/32) |
| **5. Market and community** | Added Yahoo quote context, TradingView charts, reactions, replies/revisions and feed discovery. | [#26](https://github.com/ReyA44/thesis-hub/pull/26), [#28](https://github.com/ReyA44/thesis-hub/pull/28), [#30](https://github.com/ReyA44/thesis-hub/pull/30) |
| **6. Reliability and verification** | Added rate limits, logging, CI, unit/integration tests, publication-price snapshot semantics and regression fixes. | [#34](https://github.com/ReyA44/thesis-hub/pull/34), [#36](https://github.com/ReyA44/thesis-hub/pull/36), [#38](https://github.com/ReyA44/thesis-hub/pull/38) |
| **7. UI and final review** | Refined the POC-inspired interface, prepared course documentation, and later cleaned code and scaffold files for portfolio presentation. | [#40](https://github.com/ReyA44/thesis-hub/pull/40), [#41](https://github.com/ReyA44/thesis-hub/pull/41), [#44](https://github.com/ReyA44/thesis-hub/pull/44) |

### How changes were managed

See [workflow](workflow.md) for the issue → branch → PR → CI → merge cycle and [AI-assisted development](ai-usage.md) for the tools used and their verification limits.

### Prototype and current implementation

The repository retains an [early UI proof of concept](../assets/poc-v0.1.png). **It is a design artifact, not a verified screenshot of the current running application.** Current behavior is documented in [requirements](requirements.md) and [architecture](architecture.md).

Future work is deliberately separate in the [backlog](backlog.md). Neither this history nor CI results prove the frontend has undergone a complete browser acceptance pass.
