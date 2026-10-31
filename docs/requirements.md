
# ThesisHub — Product Requirements

**Version:** 0.1
**Status:** Draft
**Project type:** Full-stack web application

## 1. Product Goal

Build a social platform for sharing structured stock-market investment theses, encouraging clear reasoning, discussion, and accountability.

## 2. Core Features

### Users
- Register, log in, and log out.
- Authenticated users can create posts and interact with others.
- Users can edit or delete their own posts.

### Thesis Posts
Required fields:
- Thesis title (one sentence maximum)
- At least one company name and ticker
- Conviction: Low / Medium / High

Optional fields:
- Full thesis
- Price target
- Time horizon and target timeframe
- Catalysts and dates
- Thesis invalidation conditions
- Suggested strategy and reasoning
- Main risks
- Market misunderstanding / opportunity
- Counter-thesis
- Sources
- Tags

### Market Data
- Retrieve stock prices from a free external API.
- Display a 1Y/YTD chart for the primary ticker.
- Store the stock price at publication.
- Calculate performance since publication.
- Calculate percentage upside/downside when a target exists.

### Reactions
Five mutually exclusive reactions:
- Rocket — TO THE MOON
- Bull — Bullish
- Neutral — Neutral
- Bear — Bearish
- Empty bag — Bag Holder

Each user can select or change one reaction per post.

### Replies
- One reply per user per post.
- Replies can be edited.
- Every previous version is preserved.
- Edit history is publicly accessible.
- Users can only modify their own replies.

### Public Feed
- One common feed for all users.
- Sort: newest, oldest, popularity, most discussed.
- Popularity = reactions + 5 × replies.

### Search & Filters
- Company name
- Stock ticker
- Tag
- Author
- Conviction
- Reaction sentiment
- Post date
- Percentage upside/downside to target

No full-text thesis search.

## 3. Technical Requirements

- React + Vite frontend
- Node.js + Express REST API
- PostgreSQL + Prisma database
- JWT authentication and bcrypt password hashing
- Modular external market-data service
- Input validation and authorization
- Automated testing
- Git/GitHub version control

## 4. Project Constraints

- Free development tools and API tiers
- No brokerage integration
- No personal trading or portfolio data
- API keys and other secrets excluded from Git
- Publicly presentable repository

## 5. Future Features (Not MVP)

- Following users
- Notifications
- Watchlists
- Leaderboards
- AI thesis analysis
- Advanced analytics

## 6. Change Management

Requirements may evolve during development.

Significant changes should be documented through
GitHub Issues, commits, and updated documentation.
