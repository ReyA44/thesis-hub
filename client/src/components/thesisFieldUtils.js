/** Plain helpers shared by the structured thesis editor. */
export const EMPTY_THESIS_DETAILS = {
    timeHorizon: "",
    targetTimeframe: "",
    catalysts: "",
    invalidation: "",
    strategy: "",
    strategyReason: "",
    mainRisks: "",
    marketMissing: "",
    counterThesis: "",
};

/**
 * Populate the editing form using an existing post.
 *
 * Prisma sends DateTime as an ISO string.
 * HTML date inputs expect YYYY-MM-DD.
 */
export function thesisDetailsFromPost(post) {
    const values = { ...EMPTY_THESIS_DETAILS };

    if (!post) return values;

    for (const field of Object.keys(values)) {
        if (field === "targetTimeframe") {
            values[field] = post[field]
                ? String(post[field]).slice(0, 10)
                : "";
        } else {
            values[field] = post[field] ?? "";
        }
    }

    return values;
}

