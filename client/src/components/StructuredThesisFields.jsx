/** Reusable form for optional structured thesis fields. */
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
