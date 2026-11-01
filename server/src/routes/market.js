
/**
 * ThesisHub — Market Data API
 *
 * Uses the unofficial yahoo-finance2 package.
 *
 * GET /api/market/usage
 *   Shows basic usage and cache statistics.
 *
 * GET /api/market/:ticker
 *   Returns a stock's last regular-market price.
 *
 * GET /api/market/:ticker?target=100
 *   Also calculates upside/downside to a price target.
 *
 * To avoid unnecessary Yahoo requests:
 * - Successful quotes are cached for 24 hours.
 * - Concurrent requests for the same ticker share one fetch.
 * - API errors are counted.
 *
 * This is intentionally lightweight for our course MVP.
 */

import { Router } from "express";
import YahooFinance from "yahoo-finance2";

export const marketRouter = Router();

const yahooFinance = new YahooFinance();

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Map: ticker => { data, expiresAt }
const cache = new Map();

// Map: ticker => Promise<quote>
const pendingRequests = new Map();

// Basic usage counters (reset when Express restarts).
const stats = {
    providerRequests: 0,
    cacheHits: 0,
    failures: 0,
    lastSuccessAt: null,
};

/**
 * Validate ticker symbols before calling Yahoo.
 *
 * Supports common examples:
 * AAPL, PENG, BRK.B, BF-B
 */
function normalizeTicker(value) {
    if (typeof value !== "string") {
        return null;
    }

    const ticker = value.trim().toUpperCase();

    if (
        ticker.length > 15 ||
        !/^[A-Z0-9]+(?:[.-][A-Z0-9]+)*$/.test(ticker)
    ) {
        return null;
    }

    return ticker;
}

/**
 * Validate an optional target price.
 *
 * Price targets should be positive decimal values.
 * We allow at most four decimal places.
 */
function parsePriceTarget(value) {
    if (value === undefined) {
        return { valid: true, value: null };
    }

    if (
        typeof value !== "string" ||
        !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/.test(value) ||
        Number(value) <= 0
    ) {
        return { valid: false, value: null };
    }

    return {
        valid: true,
        value: Number(value),
    };
}

/**
 * Retrieve a quote from Yahoo Finance.
 *
 * Return only the fields our frontend needs rather
 * than forwarding the full third-party response.
 */
async function fetchYahooQuote(ticker) {
    stats.providerRequests += 1;

    try {
        const quote = await yahooFinance.quote(ticker);

        const price = quote?.regularMarketPrice;

        if (
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price <= 0
        ) {
            throw new Error("No valid market price returned.");
        }

        const result = {
            ticker,
            price,
            currency: quote.currency || null,
            companyName:
                quote.longName ||
                quote.shortName ||
                quote.displayName ||
                ticker,

            // Date of the price supplied by Yahoo.
            priceTime: quote.regularMarketTime
                ? new Date(
                    quote.regularMarketTime
                ).toISOString()
                : null,

            fetchedAt: new Date().toISOString(),
        };

        stats.lastSuccessAt = result.fetchedAt;

        return result;

    } catch (error) {
        stats.failures += 1;

        console.error(
            `[Market] Yahoo request failed for ${ticker}:`,
            error.message
        );

        throw error;
    }
}

/**
 * Get a quote using our in-memory cache.
 *
 * On an expired cache entry:
 * - Try to refresh it.
 * - If Yahoo fails, reuse the stale cached quote.
 *
 * This prevents a temporary Yahoo outage from
 * breaking prices already fetched by ThesisHub.
 */
export async function getCachedQuote(ticker) {
    const now = Date.now();
    const cached = cache.get(ticker);

    if (cached && cached.expiresAt > now) {
        stats.cacheHits += 1;

        return {
            ...cached.data,
            stale: false,
            cached: true,
        };
    }

    // Prevent several requests for the same ticker
    // from triggering simultaneous Yahoo calls.
    if (!pendingRequests.has(ticker)) {
        const request = fetchYahooQuote(ticker)
            .then((data) => {
                cache.set(ticker, {
                    data,
                    expiresAt:
                        Date.now() + CACHE_DURATION_MS,
                });

                return data;
            })
            .finally(() => {
                pendingRequests.delete(ticker);
            });

        pendingRequests.set(ticker, request);
    }

    try {
        const data = await pendingRequests.get(ticker);

        return {
            ...data,
            stale: false,
            cached: false,
        };

    } catch {
        // Return existing stale data if Yahoo is unavailable.
        if (cached) {
            stats.cacheHits += 1;

            return {
                ...cached.data,
                stale: true,
                cached: true,
            };
        }

        // No cached data exists.
        return null;
    }
}

/**
 * GET /api/market/usage
 *
 * Simple development-only monitoring.
 * No API key or external dashboard required.
 */
marketRouter.get("/usage", (req, res) => {
    res.json({
        provider: "Yahoo Finance (unofficial)",
        cacheDurationHours: 24,
        cachedTickers: cache.size,
        pendingRequests: pendingRequests.size,

        ...stats,

        note:
            "Yahoo does not expose an official API quota. " +
            "These counters reset when the server restarts.",
    });
});

/**
 * GET /api/market/:ticker
 *
 * Optional query:
 * ?target=100.00
 *
 * Returns:
 * - Latest available regular-market price
 * - Currency
 * - Price timestamp
 * - Cache information
 * - Target upside/downside, when requested
 */
marketRouter.get("/:ticker", async (req, res) => {
    const ticker = normalizeTicker(req.params.ticker);

    if (!ticker) {
        return res.status(400).json({
            error: "Invalid ticker symbol.",
        });
    }

    const target = parsePriceTarget(req.query.target);

    if (!target.valid) {
        return res.status(400).json({
            error: "Target must be a positive decimal value.",
        });
    }

    const quote = await getCachedQuote(ticker);

    if (!quote) {
        return res.status(503).json({
            error:
                "Market data is temporarily unavailable " +
                "for this ticker.",
        });
    }

    /**
     * Business logic:
     *
     * Upside (%) =
     *   (target / current price - 1) * 100
     *
     * A negative result represents downside.
     */
    const upsidePercent = target.value === null
        ? null
        : Number(
            (
                (target.value / quote.price - 1) * 100
            ).toFixed(2)
        );

    return res.json({
        ...quote,
        priceTarget: target.value,
        upsidePercent,
    });
});
