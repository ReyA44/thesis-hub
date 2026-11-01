
/**
 * ThesisHub — Structured Thesis Form Fields
 *
 * This component only manages presentation.
 * The parent ThesisForm owns the actual React state.
 *
 * All fields are optional.
 */

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

const TEXT_FIELDS = [
    {
        name: "catalysts",
        label: "Catalysts",
        placeholder:
            "Earnings, product launches, regulatory decisions, industry changes...",
        maxLength: 3000,
    },
    {
        name: "invalidation",
        label: "What would invalidate this thesis?",
        placeholder:
            "Describe the conditions that would prove your investment thesis wrong.",
        maxLength: 3000,
    },
    {
        name: "strategy",
        label: "Investment strategy",
        placeholder:
            "Long shares, options, waiting for a pullback...",
        maxLength: 1500,
    },
    {
        name: "strategyReason",
        label: "Why this strategy?",
        placeholder:
            "Explain why your approach fits the thesis and its risks.",
        maxLength: 2000,
    },
    {
        name: "mainRisks",
        label: "Main risks",
        placeholder:
            "Business risks, valuation risks, competition, macroeconomic risks...",
        maxLength: 3000,
    },
    {
        name: "marketMissing",
        label: "What is the market missing?",
        placeholder:
            "Explain the potential mispricing or overlooked opportunity.",
        maxLength: 3000,
    },
    {
        name: "counterThesis",
        label: "Counter-thesis",
        placeholder:
            "What is the strongest argument against your view?",
        maxLength: 3000,
    },
];

export default function StructuredThesisFields({
    value,
    onChange,
    disabled = false,
}) {
    function changeField(field, newValue) {
        onChange((previous) => ({
            ...previous,
            [field]: newValue,
        }));
    }

    return (
        <details className="structured-thesis-fields">
            <summary>Advanced thesis details (optional)</summary>

            <div className="structured-thesis-fields-content">
                <p className="field-hint">
                    Make your thesis more useful by explaining
                    its timeline, catalysts, risks, and the
                    conditions under which you would change
                    your mind.
                </p>

                <label>
                    Investment horizon

                    <select
                        value={value.timeHorizon}
                        onChange={(event) =>
                            changeField(
                                "timeHorizon",
                                event.target.value
                            )
                        }
                        disabled={disabled}
                    >
                        <option value="">
                            Not specified
                        </option>
                        <option value="SHORT_TERM">
                            Short term (under 1 year)
                        </option>
                        <option value="MEDIUM_TERM">
                            Medium term (1–3 years)
                        </option>
                        <option value="LONG_TERM">
                            Long term (3+ years)
                        </option>
                    </select>
                </label>

                <label>
                    Target date

                    <input
                        type="date"
                        value={value.targetTimeframe}
                        onChange={(event) =>
                            changeField(
                                "targetTimeframe",
                                event.target.value
                            )
                        }
                        disabled={disabled}
                    />
                </label>

                {TEXT_FIELDS.map((field) => (
                    <label key={field.name}>
                        {field.label}

                        <textarea
                            value={value[field.name]}
                            onChange={(event) =>
                                changeField(
                                    field.name,
                                    event.target.value
                                )
                            }
                            placeholder={field.placeholder}
                            maxLength={field.maxLength}
                            rows={3}
                            disabled={disabled}
                        />
                    </label>
                ))}
            </div>
        </details>
    );
}
