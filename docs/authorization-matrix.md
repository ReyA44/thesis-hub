# ThesisHub — Authorization Matrix

Authorization is enforced by the Express backend. There are no admin roles or separate permission levels in the current MVP.

| Action | Visitor (not logged in) | Logged-in user |
|---|---|---|
| Read theses, replies and reactions | Yes | Yes |
| Create a thesis | No | Yes |
| Edit or delete a thesis | No | Own theses only |
| Add or change a reaction | No | Own reaction only |
| Create a reply | No | Yes (one per thesis) |
| Edit or delete a reply | No | Own reply only |

## Where permissions are implemented

- [`requireAuth.js`](../server/src/middleware/requireAuth.js) — verifies the JWT for protected routes.
- [`posts.js`](../server/src/routes/posts.js) — checks thesis ownership.
- [`replies.js`](../server/src/routes/replies.js) — checks reply ownership.
- [`reactions.js`](../server/src/routes/reactions.js) — creates, changes and deletes the authenticated user's reaction.

**Important:** Hiding UI buttons is not a security boundary; the backend performs authentication and ownership checks.
