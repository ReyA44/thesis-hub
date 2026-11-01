/**
 * Shared validation for fields accepted by both thesis creation and editing.
 * Return normalized values or a human-readable error; no database access here.
 */

const TICKER_PATTERN = /^[A-Z0-9]+(?:[.-][A-Z0-9]+)*$/;
const PRICE_PATTERN = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/;

export function parseThesisTitle(value) {
    const title = typeof value === "string" ? value.trim() : "";

    if (!title || title.length > 180 || /[\r\n]/.test(title)) {
        return { value: null, error: "Title must be a single line of 1-180 characters." };
    }

    return { value: title, error: null };
}

export function parseThesisStocks(stocks) {
    if (!Array.isArray(stocks) || stocks.length < 1 || stocks.length > 10) {
        return { value: null, error: "A thesis must include 1-10 stocks." };
    }

    const normalized = [];

    for (const stock of stocks) {
        const ticker = typeof stock?.ticker === "string"
            ? stock.ticker.trim().toUpperCase() : "";
        const companyName = typeof stock?.companyName === "string"
            ? stock.companyName.trim() : "";

        if (!TICKER_PATTERN.test(ticker) || ticker.length > 15 ||
            !companyName || companyName.length > 120) {
            return { value: null, error: "Each stock needs a valid ticker and company name." };
        }

        normalized.push({ ticker, companyName });
    }

    if (new Set(normalized.map((stock) => stock.ticker)).size !== normalized.length) {
        return { value: null, error: "Duplicate tickers are not allowed." };
    }

    return { value: normalized, error: null };
}

export function parseThesisPriceTarget(value) {
    if (value === null || value === undefined || value === "") {
        return { value: null, error: null };
    }

    if (typeof value !== "string" || !PRICE_PATTERN.test(value) ||
        Number(value) <= 0) {
        return { value: null, error: "Price target must be a positive decimal string." };
    }

    return { value, error: null };
}
