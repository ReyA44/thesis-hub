
/**
 * ThesisHub — Replies API
 *
 * GET    /api/posts/:postId/replies
 * POST   /api/posts/:postId/reply
 * PATCH  /api/posts/:postId/reply
 * DELETE /api/posts/:postId/reply
 *
 * Rules:
 * - Anyone can read replies and their revision histories.
 * - Only authenticated users can write.
 * - Each user can have one reply per post.
 * - Editing stores the previous version before updating.
 * - Users can modify only their own replies.
 */

import { Router } from "express";

import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const repliesRouter = Router();

const MAX_REPLY_LENGTH = 3000;

/**
 * Shared validation for new and edited replies.
 */
function normalizeContent(value) {
    if (typeof value !== "string") return null;

    const content = value.trim();

    if (
        content.length === 0 ||
        content.length > MAX_REPLY_LENGTH
    ) {
        return null;
    }

    return content;
}

/**
 * Return replies with author information and public
 * revision history, oldest revision first.
 */
const replyRelations = {
    user: {
        select: {
            id: true,
            username: true,
        },
    },
    revisions: {
        orderBy: [
            { createdAt: "asc" },
            { id: "asc" },
        ],
        select: {
            id: true,
            content: true,
            createdAt: true,
        },
    },
};

/**
 * GET /api/posts/:postId/replies
 *
 * Public endpoint.
 */
repliesRouter.get("/:postId/replies", async (req, res) => {
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

        const replies = await prisma.reply.findMany({
            where: { postId },
            orderBy: [
                { createdAt: "asc" },
                { id: "asc" },
            ],
            include: replyRelations,
        });

        return res.json({ replies });

    } catch (error) {
        console.error("Failed to load replies:", error);

        return res.status(500).json({
            error: "Could not retrieve replies.",
        });
    }
});

/**
 * POST /api/posts/:postId/reply
 *
 * Create the user's single reply.
 *
 * Body:
 * { "content": "My investment counterargument..." }
 */
repliesRouter.post(
    "/:postId/reply",
    requireAuth,
    async (req, res) => {
        const postId = req.params.postId;
        const content = normalizeContent(req.body?.content);

        if (content === null) {
            return res.status(400).json({
                error: "Reply must contain 1-3000 characters.",
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

            const reply = await prisma.reply.create({
                data: {
                    content,
                    postId,
                    userId: req.userId,
                },
                include: replyRelations,
            });

            return res.status(201).json({ reply });

        } catch (error) {
            // Prisma uniqueness: one reply per user per post.
            if (error.code === "P2002") {
                return res.status(409).json({
                    error:
                        "You already replied to this thesis. " +
                        "Edit your existing reply instead.",
                });
            }

            if (error.code === "P2003") {
                return res.status(404).json({
                    error: "Thesis or account no longer exists.",
                });
            }

            console.error("Failed to create reply:", error);

            return res.status(500).json({
                error: "Could not create reply.",
            });
        }
    }
);

/**
 * PATCH /api/posts/:postId/reply
 *
 * Update the authenticated user's existing reply.
 *
 * The previous content is written to ReplyRevision
 * in the same database transaction as the update.
 */
repliesRouter.patch(
    "/:postId/reply",
    requireAuth,
    async (req, res) => {
        const postId = req.params.postId;
        const content = normalizeContent(req.body?.content);

        if (content === null) {
            return res.status(400).json({
                error: "Reply must contain 1-3000 characters.",
            });
        }

        try {
            const result = await prisma.$transaction(
                async (tx) => {
                    const existing = await tx.reply.findUnique({
                        where: {
                            userId_postId: {
                                userId: req.userId,
                                postId,
                            },
                        },
                    });

                    if (!existing) {
                        return null;
                    }

                    // Avoid meaningless revisions for identical text.
                    if (existing.content === content) {
                        return tx.reply.findUnique({
                            where: { id: existing.id },
                            include: replyRelations,
                        });
                    }

                    // Preserve the previous content.
                    await tx.replyRevision.create({
                        data: {
                            replyId: existing.id,
                            content: existing.content,
                        },
                    });

                    // Update the current reply.
                    return tx.reply.update({
                        where: { id: existing.id },
                        data: { content },
                        include: replyRelations,
                    });
                }
            );

            if (!result) {
                return res.status(404).json({
                    error: "You have no reply to edit on this thesis.",
                });
            }

            return res.json({ reply: result });

        } catch (error) {
            console.error("Failed to edit reply:", error);

            return res.status(500).json({
                error: "Could not edit reply.",
            });
        }
    }
);

/**
 * DELETE /api/posts/:postId/reply
 *
 * Delete the authenticated user's reply.
 * Its revision history is deleted in the same transaction.
 *
 * This is consistent with the MVP rule that revision
 * history remains public while a reply exists.
 */
repliesRouter.delete(
    "/:postId/reply",
    requireAuth,
    async (req, res) => {
        const postId = req.params.postId;

        try {
            const deleted = await prisma.$transaction(
                async (tx) => {
                    const reply = await tx.reply.findUnique({
                        where: {
                            userId_postId: {
                                userId: req.userId,
                                postId,
                            },
                        },
                        select: { id: true },
                    });

                    if (!reply) {
                        return false;
                    }

                    await tx.replyRevision.deleteMany({
                        where: { replyId: reply.id },
                    });

                    await tx.reply.delete({
                        where: { id: reply.id },
                    });

                    return true;
                }
            );

            if (!deleted) {
                return res.status(404).json({
                    error: "You have no reply to delete.",
                });
            }

            return res.status(204).send();

        } catch (error) {
            console.error("Failed to delete reply:", error);

            return res.status(500).json({
                error: "Could not delete reply.",
            });
        }
    }
);
