/**
 * Minimal, privacy-aware HTTP access logs.
 * Never log request bodies, authorization headers or URL query values.
 */
import { randomUUID } from "node:crypto";

export function requestLogger(req, res, next) {
    const start = process.hrtime.bigint();
    req.requestId = randomUUID();
    res.setHeader("X-Request-ID", req.requestId);

    res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        console.info(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "info",
            event: "http_request",
            requestId: req.requestId,
            method: req.method,
            // Ignore query strings, which might contain sensitive search terms.
            path: req.path,
            status: res.statusCode,
            durationMs: Math.round(durationMs),
        }));
    });
    next();
}
