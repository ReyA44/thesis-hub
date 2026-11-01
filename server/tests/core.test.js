import test from "node:test";
import assert from "node:assert/strict";
import { parseThesisDetails } from "../src/utils/thesisDetails.js";
import {
    parseThesisTitle,
    parseThesisStocks,
    parseThesisPriceTarget,
} from "../src/utils/thesisInput.js";
import { rateLimit } from "../src/middleware/rateLimit.js";

test("structured details accept valid fields", () => {
    const result = parseThesisDetails({ catalysts: "Earnings", timeHorizon: "LONG_TERM", targetTimeframe: "2027-01-01" });
    assert.equal(result.error, null);
    assert.equal(result.data.catalysts, "Earnings");
    assert.equal(result.data.timeHorizon, "LONG_TERM");
    assert.equal(result.data.targetTimeframe.toISOString(), "2027-01-01T00:00:00.000Z");
});
test("PATCH semantics preserve omitted fields", () => {
    assert.deepEqual(parseThesisDetails({}).data, {});
    assert.deepEqual(parseThesisDetails({ catalysts: "" }).data, { catalysts: null });
});
test("reject invalid structured data", () => {
    assert.match(parseThesisDetails({ timeHorizon: "UNKNOWN" }).error, /horizon/);
    assert.match(parseThesisDetails({ targetTimeframe: "2027-02-30" }).error, /date/);
    assert.match(parseThesisDetails({ catalysts: 3 }).error, /catalysts/);
});
test("rate limiter returns 429 after threshold", () => {
    const limit = rateLimit({ windowMs: 60000, limit: 2 });
    const req = { ip: "198.51.100.1" };
    let nextCalls = 0;
    const res = { statusCode: 200, headers: {}, set(k, v) { this.headers[k] = v; return this; }, status(c) { this.statusCode = c; return this; }, json(x) { this.body = x; return this; } };
    for (let i = 0; i < 3; i++) limit(req, res, () => { nextCalls++; });
    assert.equal(nextCalls, 2);
    assert.equal(res.statusCode, 429);
    assert.match(res.body.error, /Too many/);
});

test("shared thesis validation normalizes titles and stock tickers", () => {
    assert.equal(parseThesisTitle("  My thesis  ").value, "My thesis");
    assert.match(parseThesisTitle("Two\\nlines").error, /single line/);
    const stocks = parseThesisStocks([
        { ticker: " msft ", companyName: " Microsoft " },
        { ticker: "brk.b", companyName: "Berkshire Hathaway" },
    ]);
    assert.equal(stocks.error, null);
    assert.deepEqual(stocks.value, [
        { ticker: "MSFT", companyName: "Microsoft" },
        { ticker: "BRK.B", companyName: "Berkshire Hathaway" },
    ]);
    assert.match(parseThesisStocks([
        { ticker: "MSFT", companyName: "Microsoft" },
        { ticker: "msft", companyName: "Microsoft" },
    ]).error, /Duplicate/);
    assert.match(parseThesisStocks([]).error, /1-10/);
    assert.match(parseThesisStocks([{ ticker: "$BAD", companyName: "Example" }]).error, /valid ticker/);
});

test("shared price-target validation preserves decimal strings and empty values", () => {
    assert.deepEqual(parseThesisPriceTarget("125.1234"), { value: "125.1234", error: null });
    assert.deepEqual(parseThesisPriceTarget(null), { value: null, error: null });
    assert.match(parseThesisPriceTarget("0").error, /positive/);
    assert.match(parseThesisPriceTarget("2.12345").error, /positive/);
    assert.match(parseThesisPriceTarget(120).error, /positive/);
});
