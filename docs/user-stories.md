# ThesisHub — Implemented User Stories

This is the final **local MVP** story map. The original roadmap evolved through GitHub issues and pull requests; feature scope is documented in [requirements.md](requirements.md).

| ID | User story | Status / acceptance |
|---|---|---|
| US-01 | As a visitor, register and log in | Implemented: validation, bcrypt, JWT, logout |
| US-02 | As a user, publish a thesis | Implemented: required title, conviction and ticker; optional details |
| US-03 | As an author, edit or delete my thesis | Implemented: API ownership checks |
| US-04 | As a visitor, evaluate market context | Implemented: last quote, chart, optional target and publication-price percentage |
| US-05 | As a user, react to a thesis | Implemented: five mutually exclusive sentiments |
| US-06 | As a user, discuss a thesis | Implemented: one reply per user, editable with public previous versions |
| US-07 | As a visitor, browse the shared feed | Implemented: inline details and interactive sections |
| US-08 | As a visitor, sort by activity | Implemented: newest, oldest, popular and discussed; bounded pool |
| US-09 | As a visitor, search and filter | Implemented: ticker/company, author, conviction, sentiment and age |
| US-10 | As a user, expect resilient and secure behavior | Implemented in code and CI; final browser acceptance pending |

## Deferred user-story extensions

- Tags, source links, and filters by calculated target upside
- Unlimited pagination and a dedicated thesis details route
- Production hosting, portfolios, following users, notifications and leaderboards

## Important business rules

- The **first ticker** is the primary ticker for price target and chart.
- `Conviction` has LOW/MEDIUM/HIGH values.
- A user has **at most one** reaction and one reply per post; database uniqueness constraints enforce these.
- Replacing a reply writes its previous text into `ReplyRevision` in one transaction.
- Popularity = reactions + 5 × replies.
- The saved quote is optional; external provider unavailability never blocks thesis creation.
- Post editing is allowed but **post edit history is not tracked** (only reply edit history is tracked).
