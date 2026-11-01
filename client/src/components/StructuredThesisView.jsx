
/**
 * ThesisHub — Public Structured Thesis Display
 *
 * Only displays fields the author actually filled in.
 * Readers can expand or collapse the details.
 */

const HORIZON_LABELS = {
    SHORT_TERM: "Short term (under 1 year)",
    MEDIUM_TERM: "Medium term (1–3 years)",
    LONG_TERM: "Long term (3+ years)",
};

const FIELDS = [
    ["catalysts", "Catalysts"],
    ["invalidation", "Thesis invalidation"],
    ["strategy", "Investment strategy"],
    ["strategyReason", "Strategy reasoning"],
    ["mainRisks", "Main risks"],
    ["marketMissing", "What the market may be missing"],
    ["counterThesis", "Counter-thesis"],
];

export default function StructuredThesisView({ post }) {
    const hasTextDetails = FIELDS.some(
        ([field]) => Boolean(post[field])
    );

    if (
        !hasTextDetails &&
        !post.timeHorizon &&
        !post.targetTimeframe
    ) {
        return null;
    }

    return (
        <details className="structured-thesis-view">
            <summary>Investment thesis details</summary>

            <div className="structured-thesis-view-content">
                {post.timeHorizon && (
                    <div>
                        <strong>Investment horizon</strong>
                        <p>
                            {HORIZON_LABELS[post.timeHorizon] ??
                                post.timeHorizon}
                        </p>
                    </div>
                )}

                {post.targetTimeframe && (
                    <div>
                        <strong>Target date</strong>
                        <p>
                            {String(
                                post.targetTimeframe
                            ).slice(0, 10)}
                        </p>
                    </div>
                )}

                {FIELDS.map(([field, label]) => {
                    if (!post[field]) return null;

                    return (
                        <div key={field}>
                            <strong>{label}</strong>
                            <p>{post[field]}</p>
                        </div>
                    );
                })}
            </div>
        </details>
    );
}
