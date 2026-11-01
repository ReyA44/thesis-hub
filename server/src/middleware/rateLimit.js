/** Small in-memory rate limiter for a single Express instance.
 * For a multi-instance deployment, replace with a shared-store limiter.
 */
export function rateLimit({ windowMs, limit }) {
    const buckets = new Map();
    return (req, res, next) => {
        const now = Date.now();
        // Express uses socket address by default; configure trust proxy only for a known proxy.
        const key = req.ip || req.socket.remoteAddress || "unknown";
        let entry = buckets.get(key);
        if (!entry || now >= entry.resetAt) {
            entry = { count: 0, resetAt: now + windowMs };
            buckets.set(key, entry);
        }
        entry.count += 1;
        if (entry.count > limit) {
            res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
            return res.status(429).json({ error: "Too many requests. Try again later." });
        }
        // Periodic opportunistic cleanup avoids unbounded growth during normal use.
        if (buckets.size > 1000) {
            for (const [address, value] of buckets) {
                if (now >= value.resetAt) buckets.delete(address);
            }
        }
        next();
    };
}
