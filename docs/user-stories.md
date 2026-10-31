# ThesisHub — MVP User Stories

**Version:** 0.1  
**Status:** Draft  
**Reference:** `docs/requirements.md`

## Epic 1 — User Authentication

### US-01: Account Registration and Login
**As a** visitor, **I want to** create an account and log in, **so that** I can publish and interact with investment theses.

**Acceptance Criteria:**
- Users can register and log in.
- Duplicate accounts are rejected.
- Passwords are securely hashed.
- Invalid credentials display an error.
- Users can log out.
- Only authenticated users can modify content.

## Epic 2 — Thesis Posts

### US-02: Create a Thesis
**As a** registered user, **I want to** publish a structured investment thesis, **so that** others can evaluate my idea.

**Acceptance Criteria:**
- Thesis title, at least one stock/ticker, and conviction are required.
- Conviction options: Low, Medium, High.
- Thesis title is limited to one sentence.
- Price target, time horizon, catalysts, risks, strategy, supporting sources, and other thesis details are optional.
- Invalid submissions display validation errors.
- Successfully submitted posts appear in the public feed.

### US-03: Manage My Posts
**As a** post author, **I want to** edit or delete my posts, **so that** I can maintain my published ideas.

**Acceptance Criteria:**
- Authors can edit their posts.
- Authors can delete their posts.
- Other users cannot modify them.
- Authorization is enforced by the backend.

## Epic 3 — Market Data Integration

### US-04: View Stock Market Data
**As a** user, **I want to** see stock prices and historical charts alongside theses, **so that** I can evaluate the ideas in market context.

**Acceptance Criteria:**
- The system retrieves prices from a free external API.
- The primary ticker displays a stock chart.
- Users can toggle between YTD and 1Y.
- The publication price is saved.
- The application calculates performance since publication.
- If a price target exists, percentage upside/downside is calculated.
- Missing or unavailable data is handled gracefully.

## Epic 4 — Social Interactions

### US-05: React to Theses
**As a** registered user, **I want to** express my sentiment using predefined reactions, **so that** others can understand my opinion.

**Acceptance Criteria:**
- Five reactions: TO THE MOON, Bullish, Neutral, Bearish, Bag Holder.
- Each reaction has a distinct icon and tooltip.
- One reaction per user per post.
- Users can change their reaction.
- Reaction counts are displayed.

### US-06: Reply to Theses
**As a** registered user, **I want to** reply to a thesis, **so that** I can share my opinion or analysis.

**Acceptance Criteria:**
- One reply per user per post.
- Users can edit their own reply.
- Users cannot edit other users' replies.
- Previous versions are preserved.
- All users can view the edit history.
- Users can delete their own reply.

## Epic 5 — Public Feed

### US-07: Browse Theses
**As a** visitor, **I want to** browse a shared public feed, **so that** I can discover investment ideas.

**Acceptance Criteria:**
- All users see the same collection of published posts.
- Posts display author, title, tickers, conviction, chart, and available thesis details.
- Users can open a post to read its full content and replies.
- Browsing does not require authentication.

### US-08: Sort the Feed
**As a** user, **I want to** sort posts, **so that** I can discover recent or popular discussions.

**Acceptance Criteria:**
- Sort by Newest, Oldest, Popularity, and Most Discussed.
- Popularity = reaction count + 5 × reply count.
- Sorting works consistently across the public feed.

### US-09: Search and Filter
**As a** user, **I want to** find relevant theses using structured criteria, **so that** I can focus on ideas that interest me.

**Acceptance Criteria:**
- Search by ticker or company name.
- Filter by author, tag, conviction, reaction sentiment, and post date.
- Filter by percentage upside/downside when a target exists.
- Filters can be combined.
- No full-text search inside thesis content.

## Epic 6 — Application Quality

### US-10: Reliable and Secure Application
**As a** user, **I want** the application to handle errors and protect my account, **so that** I can use it reliably.

**Acceptance Criteria:**
- Backend validates incoming data.
- Protected endpoints verify authentication and ownership.
- API failures display appropriate messages.
- API keys and secrets are not exposed.
- Core business logic has automated tests.
- Main user workflows are tested.

---

## Future Features — Outside MVP

- Follow users
- Notifications
- Watchlists
- Leaderboards
- AI-assisted analysis
- Advanced performance analytics

## Open Design Decisions

To be resolved during architecture and implementation:

1. Which free stock-market API to use.
2. Market-data caching and refresh frequency.
3. How deleted replies and their edit histories are handled.

## Resolved Design Decisions

### DD-01: Price Targets for Multiple Stocks

- The structured Price Target field applies only to the primary (first) ticker.
- Authors may mention additional price targets for other stocks in the optional Full Thesis description.
- Only the structured price target is used for automatic upside/downside calculations.
- Additional targets mentioned in free text are not automatically processed.

## Development Notes

- Each user story will be translated into one or more GitHub Issues.
- Implementation tasks will have clear acceptance criteria.
- Features will be developed incrementally.
- Significant scope changes will be documented.


## Implementation Roadmap

| Phase | Features | User Stories |
|---|---|---|
| 1. Foundation | Architecture, database design, project setup | — |
| 2. Authentication | Registration, login, authorization | US-01 |
| 3. Core Application | Create/edit posts, public feed | US-02, US-03, US-07 |
| 4. Market Integration | Stock API, prices, charts | US-04 |
| 5. Social Features | Reactions, replies, edit history | US-05, US-06 |
| 6. Discovery | Sorting, search, filtering | US-08, US-09 |
| 7. Finalization | Integration testing, security, deployment | US-10 |

Testing, security, and documentation will be addressed
throughout development, not only during Phase 7.

