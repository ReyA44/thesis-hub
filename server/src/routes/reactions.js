
/**
 * ThesisHub — Investment Thesis Reactions
 *
 * GET    /api/posts/:postId/reactions
 * PUT    /api/posts/:postId/reaction
 * DELETE /api/posts/:postId/reaction
 *
 * GET is public. If a valid JWT is supplied, the response
 * also identifies the current user's selected reaction.
 *
 * PUT and DELETE require authentication.
 *
 * Prisma's unique constraint on (userId, postId)
 * guarantees one reaction per user per post.
 */

import { Router } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const reactionsRouter = Router();

const REACTION_TYPES = [
    "ROCKET",
    "BULLISH",
    "NEUTRAL",
    "BEARISH",
    "BAG_HOLDER",
];

/**
 * Read an optional JWT without requiring authentication.
 *
 * Guests can see reaction counts.
 * Authenticated users can also see their own reaction.
 *
 * Invalid or expired tokens are treated as guest access
 * for this public GET endpoint only.
 */
function getOptionalUserId(req) {
    const authorization = req.headers.authorization ?? "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (!match) {
        return null;
    }

    try {
        const payload = jwt.verify(
            match[1],
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        return typeof payload.sub === "string"
            ? payload.sub
            : null;

    } catch {
        return null;
    }
}

/**
 * GET /api/posts/:postId/reactions
 *
 * Response example:
 *
 * {
 *   counts: {
 *     ROCKET: 2,
 *     BULLISH: 4,
 *     NEUTRAL: 1,
 *     BEARISH: 0,
 *     BAG_HOLDER: 0
 *   },
 *   total: 7,
 *   myReaction: "BULLISH"
 * }
 *
 * Guests receive myReaction: null.
 */
reactionsRouter.get(
    "/:postId/reactions",
    async (req, res) => {
        try {
            const postId = req.params.postId;
            const userId = getOptionalUserId(req);

            const post = await prisma.thesisPost.findUnique({
                where: { id: postId },
                select: { id: true },
            });

            if (!post) {
                return res.status(404).json({
                    error: "Thesis not found.",
                });
            }

            // Group reactions by type in PostgreSQL.
            const grouped = await prisma.reaction.groupBy({
                by: ["type"],
                where: { postId },
                _count: { _all: true },
            });

            // Initialize missing reaction types to zero.
            const counts = Object.fromEntries(
                REACTION_TYPES.map((type) => [type, 0])
            );

            for (const group of grouped) {
                counts[group.type] = group._count._all;
            }

            // Include the logged-in user's current selection.
            let myReaction = null;

            if (userId) {
                const reaction = await prisma.reaction.findUnique({
                    where: {
                        userId_postId: {
                            userId,
                            postId,
                        },
                    },
                    select: { type: true },
                });

                myReaction = reaction?.type ?? null;
            }

            const total = Object.values(counts).reduce(
                (sum, count) => sum + count,
                0
            );

            return res.json({
                counts,
                total,
                myReaction,
            });

        } catch (error) {
            console.error(
                "Failed to retrieve reactions:",
                error
            );

            return res.status(500).json({
                error: "Could not retrieve reactions.",
            });
        }
    }
);

/**
 * PUT /api/posts/:postId/reaction
 *
 * Request:
 * { "type": "ROCKET" }
 *
 * Creates a reaction, or changes the user's existing one.
 *
 * upsert = update + insert.
 * This is atomic and prevents duplicate user reactions.
 */
reactionsRouter.put(
    "/:postId/reaction",
    requireAuth,
    async (req, res) => {
        const postId = req.params.postId;
        const type = req.body?.type;

        if (!REACTION_TYPES.includes(type)) {
            return res.status(400).json({
                error:
                    "Invalid reaction type. Expected: " +
                    REACTION_TYPES.join(", "),
            });
        }

        try {
            const post = await prisma.thesisPost.findUnique({
                where: { id: postId },
                select: { id: true },
            });

            if (!post) {
                return res.status(404).json({
                    error: "Thesis not found.",
                });
            }

            /**
             * If this user already reacted, update the type.
             * Otherwise create their first reaction.
             *
             * req.userId is supplied by requireAuth.
             */
            const reaction = await prisma.reaction.upsert({
                where: {
                    userId_postId: {
                        userId: req.userId,
                        postId,
                    },
                },

                update: { type },

                create: {
                    type,
                    userId: req.userId,
                    postId,
                },

                select: {
                    id: true,
                    type: true,
                    postId: true,
                    userId: true,
                },
            });

            return res.json({ reaction });

        } catch (error) {
            if (error.code === "P2003") {
                return res.status(404).json({
                    error: "Thesis or account no longer exists.",
                });
            }

            console.error(
                "Failed to save reaction:",
                error
            );

            return res.status(500).json({
                error: "Could not save reaction.",
            });
        }
    }
);

/**
 * DELETE /api/posts/:postId/reaction
 *
 * Removes only the authenticated user's reaction.
 * Deleting an already-absent reaction is harmless.
 */
reactionsRouter.delete(
    "/:postId/reaction",
    requireAuth,
    async (req, res) => {
        const postId = req.params.postId;

        try {
            const post = await prisma.thesisPost.findUnique({
                where: { id: postId },
                select: { id: true },
            });

            if (!post) {
                return res.status(404).json({
                    error: "Thesis not found.",
                });
            }

            await prisma.reaction.deleteMany({
                where: {
                    postId,
                    userId: req.userId,
                },
            });

            return res.status(204).send();

        } catch (error) {
            console.error(
                "Failed to remove reaction:",
                error
            );

            return res.status(500).json({
                error: "Could not remove reaction.",
            });
        }
    }
);
