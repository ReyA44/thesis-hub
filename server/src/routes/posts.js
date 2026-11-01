
/**
 * ThesisHub — Investment Thesis Routes
 *
 * POST /api/posts     Create a thesis (authenticated).
 * GET  /api/posts     Retrieve the public feed.
 * GET  /api/posts/:id Retrieve a specific thesis.
 */

import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const postsRouter = Router();

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
 * Public endpoint: authentication is not required.
 * Returns the 25 most recent investment theses.
 */
postsRouter.get("/", async (req, res) => {
    try {
        const posts = await prisma.thesisPost.findMany({
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],
            take: 25,
            include: postRelations,
        });

        return res.json({ posts });

    } catch (error) {
        console.error("Failed to retrieve posts:", error);

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
