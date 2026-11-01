
/**
 * ThesisHub — Structured Thesis Details
 *
 * Shared validation for POST and PATCH.
 *
 * All structured details are optional.
 * Empty strings and null values clear a field.
 * Omitted fields are left unchanged during PATCH.
 */

export const THESIS_DETAIL_FIELDS = [
    "timeHorizon",
    "targetTimeframe",
    "catalysts",
    "invalidation",
    "strategy",
    "strategyReason",
    "mainRisks",
    "marketMissing",
    "counterThesis",
];

const TEXT_LIMITS = {
    catalysts: 3000,
    invalidation: 3000,
    strategy: 1500,
    strategyReason: 2000,
    mainRisks: 3000,
    marketMissing: 3000,
    counterThesis: 3000,
};

const VALID_HORIZONS = [
    "SHORT_TERM",
    "MEDIUM_TERM",
    "LONG_TERM",
];

/**
 * Convert user input into validated Prisma data.
 *
 * Returns:
 * {
 *     data: { ...validatedFields },
 *     error: null
 * }
 *
 * Or an error message on invalid input.
 */
export function parseThesisDetails(input) {
    const data = {};

    for (const field of THESIS_DETAIL_FIELDS) {
        // PATCH must preserve fields not included in the request.
        if (!Object.hasOwn(input, field)) continue;

        const value = input[field];

        // An explicitly empty value clears the field.
        if (value === null || value === "") {
            data[field] = null;
            continue;
        }

        // Investment horizon uses predefined options.
        if (field === "timeHorizon") {
            if (!VALID_HORIZONS.includes(value)) {
                return {
                    data: null,
                    error: "Invalid investment horizon.",
                };
            }

            data[field] = value;
            continue;
        }

        /**
         * The React date input sends YYYY-MM-DD.
         *
         * Store the date as midnight UTC to avoid
         * timezone-dependent conversion.
         */
        if (field === "targetTimeframe") {
            if (
                typeof value !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(value)
            ) {
                return {
                    data: null,
                    error: "Target date must use YYYY-MM-DD.",
                };
            }

            const parsed = new Date(
                `${value}T00:00:00.000Z`
            );

            if (
                Number.isNaN(parsed.getTime()) ||
                parsed.toISOString().slice(0, 10) !== value
            ) {
                return {
                    data: null,
                    error: "Invalid target date.",
                };
            }

            data[field] = parsed;
            continue;
        }

        // All remaining fields are optional text.
        const limit = TEXT_LIMITS[field];

        if (
            typeof value !== "string" ||
            value.length > limit
        ) {
            return {
                data: null,
                error: `${field} must contain at most ${limit} characters.`,
            };
        }

        data[field] = value.trim() || null;
    }

    return { data, error: null };
}
