
/**
 * ThesisHub — Feed Discovery Service
 *
 * Provides search, filtering, and sorting for public theses.
 *
 * Searchable fields:
 * - Stock ticker or company name
 * - Author username
 * - Conviction
 * - Reaction sentiment
 * - Post age
 *
 * Sort options:
 * - newest
 * - oldest
 * - popular
 * - discussed
 *
 * Popularity = reactions + 5 * replies.
 *
 * No full-text thesis search.
 */

import { prisma } from "../db.js";

// Keep feed responses reasonably small.
const PAGE_SIZE = 25;

// Popularity is evaluated over the 200 newest matching
// posts. This is an intentional MVP simplification.
const POPULARITY_POOL_SIZE = 200;

const VALID_CONVICTIONS = ["LOW", "MEDIUM", "HIGH"];

const VALID_SENTIMENTS = [
    "ROCKET",
    "BULLISH",
    "NEUTRAL",
    "BEARISH",
    "BAG_HOLDER",
];

const VALID_SORTS = [
    "newest",
    "oldest",
    "popular",
    "discussed",
];

const AGE_DAYS = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "365d": 365,
};

/**
 * Shared relations used by the existing posts API.
 *
 * Including reaction and reply counts lets the frontend
 * show popularity without fetching individual reactions.
 */
const feedRelations = {
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
    _count: {
        select: {
            reactions: true,
            replies: true,
        },
    },
};

/**
 * Query parameters must be single strings.
 *
 * Reject duplicate parameters and unexpected types
 * instead of silently interpreting them differently.
 */
function readParameter(query, name, maxLength = 100) {
    const value = query[name];

    if (value === undefined) return "";

    if (
        typeof value !== "string" ||
        value.length > maxLength
    ) {
        throw new DiscoveryValidationError(
            `Invalid ${name} parameter.`
        );
    }

    return value.trim();
}

/**
 * Custom error for bad user input.
 *
 * Express converts this to HTTP 400.
 */
export class DiscoveryValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "DiscoveryValidationError";
    }
}

/**
 * Attach useful engagement metadata to each post.
 */
function withEngagement(post) {
    const reactionCount = post._count.reactions;
    const replyCount = post._count.replies;

    const { _count, ...postData } = post;

    return {
        ...postData,
        reactionCount,
        replyCount,
        popularityScore: reactionCount + 5 * replyCount,
    };
}

/**
 * Retrieve public posts with optional discovery filters.
 *
 * The database handles searching and filtering.
 * Prisma handles normal chronological sorting.
 *
 * Popularity sorting is calculated in JavaScript over
 * a bounded set of matching posts for our course MVP.
 */
export async function discoverPosts(query) {
    const q = readParameter(query, "q");
    const author = readParameter(query, "author");
    const conviction = readParameter(query, "conviction");
    const sentiment = readParameter(query, "sentiment");
    const age = readParameter(query, "age");
    const sort = readParameter(query, "sort") || "newest";

    if (
        conviction &&
        !VALID_CONVICTIONS.includes(conviction)
    ) {
        throw new DiscoveryValidationError(
            "Invalid conviction filter."
        );
    }

    if (
        sentiment &&
        !VALID_SENTIMENTS.includes(sentiment)
    ) {
        throw new DiscoveryValidationError(
            "Invalid sentiment filter."
        );
    }

    if (
        age &&
        age !== "all" &&
        !Object.hasOwn(AGE_DAYS, age)
    ) {
        throw new DiscoveryValidationError(
            "Invalid age filter."
        );
    }

    if (!VALID_SORTS.includes(sort)) {
        throw new DiscoveryValidationError(
            "Invalid sort option."
        );
    }

    // Compose filters dynamically.
    const where = {};

    /**
     * Find posts associated with matching stock tickers
     * OR matching company names.
     *
     * Prisma performs case-insensitive matching.
     */
    if (q) {
        where.stocks = {
            some: {
                stock: {
                    OR: [
                        {
                            ticker: {
                                contains: q,
                                mode: "insensitive",
                            },
                        },
                        {
                            companyName: {
                                contains: q,
                                mode: "insensitive",
                            },
                        },
                    ],
                },
            },
        };
    }

    // Filter by the author's username.
    if (author) {
        where.author = {
            username: {
                contains: author,
                mode: "insensitive",
            },
        };
    }

    // Filter by conviction enum.
    if (conviction) {
        where.conviction = conviction;
    }

    /**
     * Return posts having at least one reaction
     * of the selected sentiment.
     */
    if (sentiment) {
        where.reactions = {
            some: {
                type: sentiment,
            },
        };
    }

    // Apply a creation-date cutoff.
    if (age && age !== "all") {
        const days = AGE_DAYS[age];

        const cutoff = new Date(
            Date.now() - days * 24 * 60 * 60 * 1000
        );

        where.createdAt = {
            gte: cutoff,
        };
    }

    /**
     * Standard sorting is handled by PostgreSQL.
     *
     * Discussed sorts by number of replies.
     */
    let orderBy = [
        { createdAt: "desc" },
        { id: "desc" },
    ];

    if (sort === "oldest") {
        orderBy = [
            { createdAt: "asc" },
            { id: "asc" },
        ];
    }

    if (sort === "discussed") {
        orderBy = [
            { replies: { _count: "desc" } },
            { createdAt: "desc" },
            { id: "desc" },
        ];
    }

    const posts = await prisma.thesisPost.findMany({
        where,
        orderBy,
        include: feedRelations,

        // Popularity uses a larger candidate pool.
        take:
            sort === "popular"
                ? POPULARITY_POOL_SIZE
                : PAGE_SIZE,
    });

    const results = posts.map(withEngagement);

    /**
     * Sort popularity in application code because
     * the formula combines two different relation counts.
     *
     * Tie-breaker: newer post wins.
     */
    if (sort === "popular") {
        results.sort((a, b) => {
            if (b.popularityScore !== a.popularityScore) {
                return b.popularityScore - a.popularityScore;
            }

            const timeDifference =
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime();

            return timeDifference ||
                b.id.localeCompare(a.id);
        });
    }

    return {
        posts: results.slice(0, PAGE_SIZE),
    };
}
