
/**
 * Authentication middleware.
 *
 * Checks the JWT before allowing access to protected routes.
 */

import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
    // Expect: Authorization: Bearer <token>
    const authorization = req.headers.authorization ?? "";

    const match = authorization.match(/^Bearer\s+(.+)$/i);

    // Reject requests without a Bearer token.
    if (!match) {
        return res.status(401).json({
            error: "Authentication required.",
        });
    }

    try {
        // Verify the token's signature and expiration.
        const payload = jwt.verify(
            match[1],
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        // Ensure the token identifies a user.
        if (
            typeof payload !== "object" ||
            typeof payload.sub !== "string"
        ) {
            return res.status(401).json({
                error: "Invalid authentication token.",
            });
        }

        // Attach the authenticated user's ID to this request.
        req.userId = payload.sub;

        // Continue to the protected route.
        next();

    } catch {
        // Includes expired tokens and invalid signatures.
        return res.status(401).json({
            error: "Invalid or expired authentication token.",
        });
    }
}
