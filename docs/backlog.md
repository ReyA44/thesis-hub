# ThesisHub — Product roadmap and backlog

**Current state:** The local full-stack MVP works. All items below are **future work, not implemented features**. Priorities are directional: `P0` means readiness work before inviting friends; `P1` is the next product layer; `P2` is optional exploration. [GitHub Issues](https://github.com/ReyA44/thesis-hub/issues) track the actionable tasks.

## P0 — Before sharing with friends

| Requirement | What needs to happen | Issue |
|---|---|---|
| Private beta hosting | Repeatable deployment, HTTPS, secrets and a usable access URL | [#45](https://github.com/ReyA44/thesis-hub/issues/45) |
| Data rights and project license | Verify Yahoo Finance / TradingView terms; choose a source-code license | [#46](https://github.com/ReyA44/thesis-hub/issues/46) |
| Accounts and privacy | Password recovery, account deletion and a clear privacy policy | [#47](https://github.com/ReyA44/thesis-hub/issues/47) |
| Abuse protection | Basic moderation, reporting, stronger rate-limit/security review | [#48](https://github.com/ReyA44/thesis-hub/issues/48) |
| Operational readiness | Database backups, monitoring, desktop/mobile browser acceptance and real screenshots | [#49](https://github.com/ReyA44/thesis-hub/issues/49) |

**Suggested path:** clarify data rights and privacy → configure small beta hosting → add abuse/backup safeguards → manually test on actual devices → invite a small group. Production complexity should follow real needs, not precede them.

## P1 — Next product features

These are the main extensions to the thesis-centered product concept.

| Feature | What it adds | Issue |
|---|---|---|
| **Historical performance per thesis** | Reliable publication baselines and actual price evolution, with explicit bullish/bearish direction and target-vs-actual comparison | [#56](https://github.com/ReyA44/thesis-hub/issues/56) |
| **Thesis lifecycle** | Clear **active**, **invalidated**, **completed** and **outdated** states, with accountable status changes | [#57](https://github.com/ReyA44/thesis-hub/issues/57) |
| **Investor track record** | Historical published ideas, evaluable outcomes and transparent metrics, rather than an arbitrary reputation score | [#58](https://github.com/ReyA44/thesis-hub/issues/58) |
| **Company/ticker pages** | A shareable page connecting every thesis and discussion associated with a stock | [#59](https://github.com/ReyA44/thesis-hub/issues/59) |
| **Follow and save** | Follow investors, save theses, maintain ticker watchlists and browse a personal feed | [#60](https://github.com/ReyA44/thesis-hub/issues/60) |
| Pagination and complete feed discovery | Browse beyond 25 results; remove popularity's newest-200 candidate restriction | [#50](https://github.com/ReyA44/thesis-hub/issues/50) |
| Thesis links, sources, tags and target filters | Direct thesis links, structured supporting-source URLs, thematic tags and filtering by price-target upside/downside | [#51](https://github.com/ReyA44/thesis-hub/issues/51) |

**Performance semantics matter:** The MVP already attempts to capture a **single, optional** primary-ticker quote on publication and shows raw price change when data exists. It does **not** yet implement historical return series, directional investment outcomes, lifecycle states or investor rankings. #56, #57 and #58 should define missing data, editing, dividends/splits, timing and sampling limitations before claiming track-record results.

## P2 — Later or exploratory

| Feature group | Deferred details | Issue |
|---|---|---|
| Profiles and notifications | Author profiles, opt-in updates and **catalyst reminders** once dated catalysts exist; any leaderboard must use transparent outcomes | [#52](https://github.com/ReyA44/thesis-hub/issues/52) |
| Structured thesis detail extensions | **Dated catalysts**, custom horizons, structured strategy/instrument types, and auditable post-update/version history | [#53](https://github.com/ReyA44/thesis-hub/issues/53) |
| Additional chart and quote options | Charts for secondary tickers, exchange ambiguity, and licensed higher-frequency/real-time quotes if worthwhile | [#61](https://github.com/ReyA44/thesis-hub/issues/61) |
| AI-assisted thesis analysis | Optional help with reasoning or counterarguments, evaluated for accuracy, privacy, cost and usability | [#62](https://github.com/ReyA44/thesis-hub/issues/62) |
| Sentiment insights | Reaction distributions, optional advanced sentiment statistics and accessible icon-first reactions | [#63](https://github.com/ReyA44/thesis-hub/issues/63) |
| Mobile-specific experience | Touch-friendly UI, responsive chart/form review and accessibility testing using the existing React/CSS stack | [#64](https://github.com/ReyA44/thesis-hub/issues/64) |

## Reconciliation with the original project plan

The [initial requirements](requirements.md) described an MVP plus optional future work. The original planning notes have now been checked against this backlog:

- **Already in the MVP:** authentication, public feed, structured theses (including multiple tickers, conviction and optional reasoning), current available quote, lazy YTD/1Y TradingView chart, target-upside display, conditional publication-price snapshot, five reactions, editable replies, basic discovery/sorting and author-controlled edits/deletions.
- **Originally planned but still deferred:** theme tags, supporting sources and target-upside filters **(#51)**; dated catalysts, custom horizons, structured strategies and post revisions **(#53)**; author profiles, notifications and catalyst reminders **(#52)**; following, saved posts and watchlists **(#60)**; accountable performance/target outcomes and possible evidence-based leaderboards **(#56, #58)**; multiple per-ticker charts and optional real-time market data **(#61)**; AI assistance **(#62)**; advanced sentiment / icon-first reaction UX **(#63)**; mobile refinements **(#64)**; moderation **(#48)**.
- **Intentional implementation difference:** The original plan envisaged fetching historical prices for charts through a market-data API. The current app instead embeds TradingView's chart; it does **not** store TradingView OHLC data. Licensed historical quote access is a future concern for #56/#61, not a missing requirement for the current chart.

## Principles

- Keep the system understandable: plain React, Express, Prisma and PostgreSQL until a clear requirement justifies more complexity.
- Preserve accountability: publication snapshots, thesis edits, direction and lifecycle dates must not silently rewrite historical outcomes.
- Distinguish users' published ideas from actual executed trades; do **not** assume brokerage positions, invested amounts or investment skill.
- Verify licensing before distributing financial market data or deploying publicly.
- Implement features incrementally with tests. The [README](../README.md) describes what works **today**, while this page records future possibilities.
