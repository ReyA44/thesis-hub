
/**
 * ThesisHub — Investment Thesis Routes
 *
 * POST /api/posts     Create a thesis (authenticated).
 * GET  /api/posts     Retrieve the public feed.
 * GET  /api/posts/:id Retrieve a specific thesis.
 */

import { Router } from "express";
import { getCachedQuote } from "./market.js";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
    discoverPosts,
    DiscoveryValidationError,
} from "../services/discoverPosts.js";
import {
    THESIS_DETAIL_FIELDS,
    parseThesisDetails,
} from "../utils/thesisDetails.js";
export function createPostsRouter({ publicationQuoteLookup = getCachedQuote } = {}) {
const postsRouter = Router();

/**
 * Shared Prisma query configuration.
 *
 * Include author information and ordered stock tickers
 * whenever a post is returned to the frontend.
 */
const postRelations = {
    author: {
        select: {
            id: true,
            username: true,
        },
    },
    stocks: {
        orderBy: { position: "asc" },
        include: {
            stock: {
                select: {
                    ticker: true,
                    companyName: true,
                },
            },
        },
    },
};

/**
 * POST /api/posts
 *
 * A valid JWT is required.
 *
 * Example request:
 * {
 *   "title": "Microsoft has significant AI upside",
 *   "conviction": "HIGH",
 *   "stocks": [
 *     {
 *       "ticker": "MSFT",
 *       "companyName": "Microsoft"
 *     }
 *   ],
 *   "fullThesis": "Optional detailed analysis.",
 *   "priceTarget": "650.00"
 * }
 */
postsRouter.post("/", requireAuth, async (req, res) => {
    const {
        title,
        conviction,
        stocks,
        fullThesis,
        priceTarget,
    } = req.body ?? {};

    // Validate title: must be nonempty and reasonably short.
    const cleanTitle =
        typeof title === "string" ? title.trim() : "";

    if (
        !cleanTitle ||
        cleanTitle.length > 180 ||
        /[\r\n]/.test(cleanTitle)
    ) {
        return res.status(400).json({
            error: "Title must be a single line of 1-180 characters.",
        });
    }

    // Only predefined conviction values are accepted.
    if (!["LOW", "MEDIUM", "HIGH"].includes(conviction)) {
        return res.status(400).json({
            error: "Conviction must be LOW, MEDIUM, or HIGH.",
        });
    }

    // A thesis must reference between 1 and 10 stocks.
    if (
        !Array.isArray(stocks) ||
        stocks.length < 1 ||
        stocks.length > 10
    ) {
        return res.status(400).json({
            error: "A thesis must include 1-10 stocks.",
        });
    }

    /**
     * Normalize and validate each stock.
     *
     * The array order matters:
     * index 0 is the primary stock associated with
     * the structured price target.
     */
    const normalizedStocks = [];

    for (const stock of stocks) {
        const ticker =
            typeof stock?.ticker === "string"
                ? stock.ticker.trim().toUpperCase()
                : "";

        const companyName =
            typeof stock?.companyName === "string"
                ? stock.companyName.trim()
                : "";

        // Accept common ticker formats such as BRK.B.
        if (!/^[A-Z0-9]+(?:[.-][A-Z0-9]+)*$/.test(ticker) ||
            ticker.length > 15 ||
            !companyName ||
            companyName.length > 120) {
            return res.status(400).json({
                error: "Each stock needs a valid ticker and company name.",
            });
        }

        normalizedStocks.push({ ticker, companyName });
    }

    // Prevent adding the same stock more than once.
    const tickers = normalizedStocks.map(
        (stock) => stock.ticker
    );

    if (new Set(tickers).size !== tickers.length) {
        return res.status(400).json({
            error: "Duplicate tickers are not allowed.",
        });
    }

    // The detailed thesis is optional.
    if (
        fullThesis != null &&
        (typeof fullThesis !== "string" ||
            fullThesis.length > 10000)
    ) {
        return res.status(400).json({
            error: "Full thesis must contain at most 10,000 characters.",
        });
    }

    /**
     * Price targets are accepted as decimal strings.
     * This avoids floating-point rounding during input.
     *
     * PostgreSQL uses DECIMAL(16,4) for this field.
     */
    const normalizedTarget =
        priceTarget == null || priceTarget === ""
            ? null
            : priceTarget;

    if (
        normalizedTarget !== null &&
        (
            typeof normalizedTarget !== "string" ||
            !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/.test(
                normalizedTarget
            ) ||
            Number(normalizedTarget) <= 0
        )
    ) {
        return res.status(400).json({
            error: "Price target must be a positive decimal string.",
        });
    }
    const details = parseThesisDetails(req.body ?? {});

    if (details.error) {
        return res.status(400).json({
            error: details.error,
        });
    }
    // Capture the last available regular-market quote for the primary ticker.
    // A provider outage never prevents users from publishing their thesis.
    // The maximum wait keeps the create-post workflow responsive.
    let publicationQuote = null;
    try {
        publicationQuote = await Promise.race([
            publicationQuoteLookup(normalizedStocks[0].ticker),
            new Promise((resolve) => setTimeout(() => resolve(null), 2000)),
        ]);
    } catch (error) {
        console.warn("Publication price unavailable:", error?.message || "Unknown error");
    }
    // Don't capture stale fallback data as a fresh publication snapshot.
    if (publicationQuote?.stale || !Number.isFinite(publicationQuote?.price) ||
        publicationQuote.price <= 0) {
        publicationQuote = null;
    }

    try {
        /**
         * Create the post and its stock relationships.
         *
         * connectOrCreate:
         * - Reuses an existing stock when its ticker exists.
         * - Creates a new stock otherwise.
         *
         * Prisma executes the nested write transactionally.
         */
        const post = await prisma.thesisPost.create({
            data: {
                title: cleanTitle,
                conviction,
                fullThesis: fullThesis?.trim() || null,
                priceTarget: normalizedTarget,
                priceAtPublication: publicationQuote?.price ?? null,
                // This is the market observation timestamp, not the post creation timestamp.
                priceCapturedAt: publicationQuote?.priceTime
                    ? new Date(publicationQuote.priceTime) : null,
                ...details.data,

                // The author comes from the verified JWT,
                // never from a user-controlled request field.
                author: {
                    connect: { id: req.userId },
                },

                stocks: {
                    create: normalizedStocks.map((stock, index) => ({
                        position: index,
                        stock: {
                            connectOrCreate: {
                                where: { ticker: stock.ticker },
                                create: {
                                    ticker: stock.ticker,
                                    companyName: stock.companyName,
                                },
                            },
                        },
                    })),
                },
            },
            include: postRelations,
        });

        // A new resource was created.
        return res.status(201).json({ post });

    } catch (error) {
        // A token may refer to an account that was deleted.
        if (error.code === "P2025") {
            return res.status(401).json({
                error: "Authenticated account no longer exists.",
            });
        }

        console.error("Failed to create thesis:", error);

        return res.status(500).json({
            error: "Could not create thesis.",
        });
    }
});


/**
 * GET /api/posts
 *
 * Public investment thesis discovery endpoint.
 *
 * Optional query parameters:
 * - q: ticker or company name
 * - author: username
 * - conviction: LOW, MEDIUM, HIGH
 * - sentiment: reaction type
 * - age: all, 7d, 30d, 90d, 365d
 * - sort: newest, oldest, popular, discussed
 *
 * Existing POST, GET /:id, PATCH and DELETE
 * endpoints remain unchanged.
 */
postsRouter.get("/", async (req, res) => {
    try {
        const result = await discoverPosts(req.query);
        return res.json(result);

    } catch (error) {
        if (error instanceof DiscoveryValidationError) {
            return res.status(400).json({
                error: error.message,
            });
        }

        console.error("Failed to discover posts:", error);

        return res.status(500).json({
            error: "Could not retrieve posts.",
        });
    }
});


/**
 * GET /api/posts/:id
 *
 * Retrieve one public thesis using its unique ID.
 */
postsRouter.get("/:id", async (req, res) => {
    try {
        const post = await prisma.thesisPost.findUnique({
            where: { id: req.params.id },
            include: postRelations,
        });

        if (!post) {
            return res.status(404).json({
                error: "Thesis not found.",
            });
        }

        return res.json({ post });

    } catch (error) {
        console.error("Failed to retrieve thesis:", error);

        return res.status(500).json({
            error: "Could not retrieve thesis.",
        });
    }
});


/**
 * PATCH /api/posts/:id
 *
 * Update an investment thesis.
 *
 * Authentication is required, and only the original
 * author may update the post.
 *
 * PATCH supports partial updates:
 * fields omitted from the request remain unchanged.
 *
 * Editable fields:
 * - title
 * - conviction
 * - fullThesis
 * - priceTarget
 * - stocks
 */
postsRouter.patch("/:id", requireAuth, async (req, res) => {
    const postId = req.params.id;
    const changes = req.body;

    // Explicitly define fields users are allowed to edit.
    // This prevents arbitrary database-field modifications.
    const allowedFields = [
        "title",
        "conviction",
        "fullThesis",
        "priceTarget",
        "stocks",
        ...THESIS_DETAIL_FIELDS,
    ];

    // A PATCH request must contain at least one valid field.
    if (
        !changes ||
        typeof changes !== "object" ||
        Array.isArray(changes) ||
        Object.keys(changes).length === 0 ||
        Object.keys(changes).some(
            (field) => !allowedFields.includes(field)
        )
    ) {
        return res.status(400).json({
            error: "Request contains no valid editable fields.",
        });
    }

    // Prisma update data is constructed only from validated fields.
    const updateData = {};

    const details = parseThesisDetails(changes);

    if (details.error) {
        return res.status(400).json({
            error: details.error,
        });
    }

    Object.assign(updateData, details.data);
    /**
     * Validate an updated title when one is provided.
     */
    if ("title" in changes) {
        const title =
            typeof changes.title === "string"
                ? changes.title.trim()
                : "";

        if (
            !title ||
            title.length > 180 ||
            /[\r\n]/.test(title)
        ) {
            return res.status(400).json({
                error: "Title must be a single line of 1-180 characters.",
            });
        }

        updateData.title = title;
    }

    /**
     * Validate conviction.
     */
    if ("conviction" in changes) {
        if (
            !["LOW", "MEDIUM", "HIGH"].includes(
                changes.conviction
            )
        ) {
            return res.status(400).json({
                error: "Invalid conviction value.",
            });
        }

        updateData.conviction = changes.conviction;
    }

    /**
     * Validate optional full thesis text.
     *
     * Sending null or an empty string clears the field.
     */
    if ("fullThesis" in changes) {
        if (
            changes.fullThesis !== null &&
            (
                typeof changes.fullThesis !== "string" ||
                changes.fullThesis.length > 10000
            )
        ) {
            return res.status(400).json({
                error: "Full thesis must contain at most 10,000 characters.",
            });
        }

        updateData.fullThesis =
            changes.fullThesis?.trim() || null;
    }

    /**
     * Validate the primary stock's price target.
     *
     * Decimal values are represented as strings to
     * avoid JavaScript floating-point precision problems.
     */
    if ("priceTarget" in changes) {
        const target =
            changes.priceTarget === "" ||
                changes.priceTarget === null
                ? null
                : changes.priceTarget;

        if (
            target !== null &&
            (
                typeof target !== "string" ||
                !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/.test(target) ||
                Number(target) <= 0
            )
        ) {
            return res.status(400).json({
                error: "Price target must be a positive decimal string.",
            });
        }

        updateData.priceTarget = target;
    }

    /**
     * Validate and replace the associated stocks
     * only when the request includes a stocks array.
     */
    if ("stocks" in changes) {
        const stocks = changes.stocks;

        if (
            !Array.isArray(stocks) ||
            stocks.length < 1 ||
            stocks.length > 10
        ) {
            return res.status(400).json({
                error: "A thesis must contain 1-10 stocks.",
            });
        }

        const normalizedStocks = [];

        for (const stock of stocks) {
            const ticker =
                typeof stock?.ticker === "string"
                    ? stock.ticker.trim().toUpperCase()
                    : "";

            const companyName =
                typeof stock?.companyName === "string"
                    ? stock.companyName.trim()
                    : "";

            if (
                !/^[A-Z0-9]+(?:[.-][A-Z0-9]+)*$/.test(ticker) ||
                ticker.length > 15 ||
                !companyName ||
                companyName.length > 120
            ) {
                return res.status(400).json({
                    error: "Each stock needs a valid ticker and company name.",
                });
            }

            normalizedStocks.push({
                ticker,
                companyName,
            });
        }

        // Database uniqueness constraints prohibit duplicates.
        const tickers = normalizedStocks.map(
            (stock) => stock.ticker
        );

        if (new Set(tickers).size !== tickers.length) {
            return res.status(400).json({
                error: "Duplicate tickers are not allowed.",
            });
        }

        /**
         * Replace the existing PostStock relationships.
         *
         * deleteMany removes this post's ticker associations,
         * NOT the shared Stock records.
         *
         * create rebuilds the associations in the new order.
         *
         * Both operations are part of Prisma's nested write.
         */
        updateData.stocks = {
            deleteMany: {},
            create: normalizedStocks.map((stock, index) => ({
                position: index,

                stock: {
                    connectOrCreate: {
                        where: { ticker: stock.ticker },
                        create: {
                            ticker: stock.ticker,
                            companyName: stock.companyName,
                        },
                    },
                },
            })),
        };
    }

    try {
        /**
         * Check whether the post exists and who owns it.
         *
         * req.userId comes from our JWT middleware,
         * not from the request body.
         */
        const existingPost = await prisma.thesisPost.findUnique({
            where: { id: postId },
            select: { authorId: true },
        });

        if (!existingPost) {
            return res.status(404).json({
                error: "Thesis not found.",
            });
        }

        if (existingPost.authorId !== req.userId) {
            return res.status(403).json({
                error: "You cannot edit another user's thesis.",
            });
        }

        /**
         * Update only if the post still belongs to this user.
         *
         * Including authorId in the update condition adds
         * another database-level ownership safeguard.
         */
        const post = await prisma.thesisPost.update({
            where: {
                id: postId,
                authorId: req.userId,
            },

            data: updateData,

            // Return the updated post in our existing API format.
            include: postRelations,
        });

        return res.json({ post });

    } catch (error) {
        // The post may have been deleted after the initial check.
        if (error.code === "P2025") {
            return res.status(404).json({
                error: "Thesis no longer exists.",
            });
        }

        console.error("Failed to update thesis:", error);

        return res.status(500).json({
            error: "Could not update thesis.",
        });
    }
});


/**
 * DELETE /api/posts/:id
 *
 * Permanently delete an investment thesis.
 *
 * Only its original author may delete it.
 *
 * Deletion includes related:
 * - Reply revisions
 * - Replies
 * - Reactions
 * - PostStock relationships
 *
 * Shared Stock records and user accounts remain intact.
 */
postsRouter.delete("/:id", requireAuth, async (req, res) => {
    const postId = req.params.id;

    try {
        /**
         * Interactive Prisma transaction:
         *
         * All database operations succeed together,
         * or PostgreSQL rolls back the entire operation.
         */
        const result = await prisma.$transaction(async (tx) => {
            // Verify post existence and ownership.
            const post = await tx.thesisPost.findUnique({
                where: { id: postId },
                select: { authorId: true },
            });

            if (!post) {
                return { status: 404 };
            }

            if (post.authorId !== req.userId) {
                return { status: 403 };
            }

            /**
             * Remove dependent records before deleting the post.
             *
             * Our Prisma schema has foreign-key relationships
             * without cascading deletes, so cleanup is explicit.
             */

            // First remove revisions belonging to this post's replies.
            await tx.replyRevision.deleteMany({
                where: {
                    reply: {
                        is: { postId },
                    },
                },
            });

            // Then remove the replies.
            await tx.reply.deleteMany({
                where: { postId },
            });

            // Remove reactions.
            await tx.reaction.deleteMany({
                where: { postId },
            });

            // Remove relationships with stock records.
            await tx.postStock.deleteMany({
                where: { postId },
            });

            // Finally delete the thesis itself.
            await tx.thesisPost.delete({
                where: {
                    id: postId,
                    authorId: req.userId,
                },
            });

            return { status: 204 };
        });

        if (result.status === 404) {
            return res.status(404).json({
                error: "Thesis not found.",
            });
        }

        if (result.status === 403) {
            return res.status(403).json({
                error: "You cannot delete another user's thesis.",
            });
        }

        // HTTP 204 means successful deletion with no response body.
        return res.status(204).send();

    } catch (error) {
        console.error("Failed to delete thesis:", error);

        return res.status(500).json({
            error: "Could not delete thesis.",
        });
    }
});

return postsRouter;
}

// Default router used in production; tests can inject a deterministic quote source.
export const postsRouter = createPostsRouter();
