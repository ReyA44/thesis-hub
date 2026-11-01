
/**
 * ThesisHub — Investment Thesis Form
 *
 * Supports two modes:
 * 1. Create: publish a new thesis using POST /api/posts.
 * 2. Edit: update an existing thesis using PATCH /api/posts/:id.
 *
 * Props:
 * apiUrl       — Base URL of the Express backend.
 * token        — JWT belonging to the authenticated user.
 * onPublished  — Callback after successfully saving.
 * editingPost  — Existing post to edit, or null for creation.
 * onCancel     — Callback to close the editor.
 */

import { useRef, useState } from "react";
import StructuredThesisFields, {
    EMPTY_THESIS_DETAILS,
    thesisDetailsFromPost,
} from "./StructuredThesisFields.jsx";

/**
 * Build stock rows from an existing thesis.
 * Each row receives a local ID used as its React key.
 */
function createInitialStocks(editingPost) {
    if (!editingPost?.stocks?.length) {
        return [{ id: 0, ticker: "", companyName: "" }];
    }

    return editingPost.stocks.map((association, index) => ({
        id: index,
        ticker: association.stock.ticker,
        companyName: association.stock.companyName,
    }));
}

export default function ThesisForm({
    apiUrl,
    token,
    onPublished,
    editingPost = null,
    onCancel = () => { },
}) {
    const isEditing = editingPost !== null;

    // Required thesis fields.
    const [title, setTitle] = useState(
        editingPost?.title ?? ""
    );

    const [conviction, setConviction] = useState(
        editingPost?.conviction ?? "MEDIUM"
    );

    // Optional thesis fields.
    const [fullThesis, setFullThesis] = useState(
        editingPost?.fullThesis ?? ""
    );

    const [priceTarget, setPriceTarget] = useState(
        editingPost?.priceTarget?.toString() ?? ""
    );

    const [details, setDetails] = useState(
        () => thesisDetailsFromPost(editingPost)
    );

    /**
     * The first stock is always the primary ticker.
     *
     * Its position determines which stock the price target
     * applies to.
     */
    const [stocks, setStocks] = useState(
        () => createInitialStocks(editingPost)
    );

    // Generate unique IDs for newly added stock rows.
    const nextStockId = useRef(
        editingPost?.stocks?.length ?? 1
    );

    // Form feedback.
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /**
     * Update a field in one stock row without directly
     * mutating React state.
     */
    function updateStock(rowId, field, value) {
        setStocks((currentStocks) =>
            currentStocks.map((stock) =>
                stock.id === rowId
                    ? { ...stock, [field]: value }
                    : stock
            )
        );
    }

    /**
     * Add another ticker.
     *
     * The backend supports a maximum of 10 stocks per thesis.
     */
    function addStock() {
        if (stocks.length >= 10) return;

        const newStock = {
            id: nextStockId.current,
            ticker: "",
            companyName: "",
        };

        nextStockId.current += 1;

        setStocks((currentStocks) => [
            ...currentStocks,
            newStock,
        ]);
    }

    /**
     * Remove a stock row, retaining at least one.
     */
    function removeStock(rowId) {
        setStocks((currentStocks) => {
            if (currentStocks.length === 1) {
                return currentStocks;
            }

            return currentStocks.filter(
                (stock) => stock.id !== rowId
            );
        });
    }

    /**
     * Send a POST or PATCH request, depending on form mode.
     */
    async function handleSubmit(event) {
        event.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        if (!token) {
            setError("Please log in before saving a thesis.");
            setLoading(false);
            return;
        }

        /**
         * Both endpoints accept the same structured fields.
         *
         * PATCH currently sends all editable fields, rather
         * than only the fields the user changed.
         *
         * The stock array is ordered so the first ticker
         * remains the primary ticker.
         */
        const payload = {
            title: title.trim(),
            conviction,

            stocks: stocks.map((stock) => ({
                ticker: stock.ticker.trim().toUpperCase(),
                companyName: stock.companyName.trim(),
            })),

            fullThesis: fullThesis.trim(),

            // An empty value clears an existing price target
            // during editing. It is omitted during creation.
            priceTarget: priceTarget.trim() || (
                isEditing ? null : undefined
            ),

            ...details,
        };

        const endpoint = isEditing
            ? `${apiUrl}/api/posts/${editingPost.id}`
            : `${apiUrl}/api/posts`;

        try {
            const response = await fetch(endpoint, {
                method: isEditing ? "PATCH" : "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },

                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Your session may have expired. Log out and sign in again."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "You are not authorized to modify this thesis."
                    );
                }

                throw new Error(
                    data.error || "Could not save investment thesis."
                );
            }

            /**
             * Successful edit:
             *
             * The parent component closes the editor and
             * refreshes the feed.
             */
            if (isEditing) {
                onPublished();
                return;
            }

            /**
             * Successful creation:
             *
             * Clear all fields so the user can publish
             * another thesis.
             */
            setTitle("");
            setConviction("MEDIUM");
            setFullThesis("");
            setPriceTarget("");
            setDetails({ ...EMPTY_THESIS_DETAILS });

            setStocks([
                {
                    id: nextStockId.current++,
                    ticker: "",
                    companyName: "",
                },
            ]);

            setSuccess("Your investment thesis was published!");

            // Refresh the public feed.
            onPublished();

        } catch (caughtError) {
            setError(
                caughtError.message || "Unable to contact the server."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="new-post">
            <h2>
                {isEditing
                    ? "Edit investment thesis"
                    : "Publish an investment thesis"}
            </h2>

            <form
                className="thesis-form"
                onSubmit={handleSubmit}
            >
                {/* Required: thesis title */}
                <label htmlFor="thesis-title">
                    Thesis title *

                    <input
                        id="thesis-title"
                        type="text"
                        value={title}
                        onChange={(event) =>
                            setTitle(event.target.value)
                        }
                        maxLength={180}
                        placeholder="Why I believe this stock may outperform..."
                        required
                        disabled={loading}
                    />
                </label>

                <p className="field-hint">
                    Keep the title concise and on one line.
                </p>

                {/* Required: conviction */}
                <label htmlFor="thesis-conviction">
                    Conviction *

                    <select
                        id="thesis-conviction"
                        value={conviction}
                        onChange={(event) =>
                            setConviction(event.target.value)
                        }
                        disabled={loading}
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                    </select>
                </label>

                {/* Required: associated stocks */}
                <fieldset
                    className="stocks-fieldset"
                    disabled={loading}
                >
                    <legend>Stocks *</legend>

                    <p className="field-hint">
                        The first stock is the primary ticker
                        associated with the price target.
                    </p>

                    {stocks.map((stock, index) => (
                        <div
                            key={stock.id}
                            className="stock-row"
                        >
                            <label>
                                {index === 0
                                    ? "Primary ticker"
                                    : `Ticker ${index + 1}`}

                                <input
                                    type="text"
                                    value={stock.ticker}
                                    onChange={(event) =>
                                        updateStock(
                                            stock.id,
                                            "ticker",
                                            event.target.value.toUpperCase()
                                        )
                                    }
                                    maxLength={15}
                                    placeholder="MSFT"
                                    required
                                />
                            </label>

                            <label>
                                Company name

                                <input
                                    type="text"
                                    value={stock.companyName}
                                    onChange={(event) =>
                                        updateStock(
                                            stock.id,
                                            "companyName",
                                            event.target.value
                                        )
                                    }
                                    maxLength={120}
                                    placeholder="Microsoft"
                                    required
                                />
                            </label>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => removeStock(stock.id)}
                                disabled={
                                    stocks.length === 1 || loading
                                }
                                aria-label={`Remove stock ${index + 1}`}
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={addStock}
                        disabled={stocks.length >= 10 || loading}
                    >
                        + Add another stock
                    </button>
                </fieldset>

                {/* Optional: detailed thesis text */}
                <label htmlFor="full-thesis">
                    Full thesis (optional)

                    <textarea
                        id="full-thesis"
                        value={fullThesis}
                        onChange={(event) =>
                            setFullThesis(event.target.value)
                        }
                        maxLength={10000}
                        rows={5}
                        placeholder="Explain the reasoning behind your investment thesis..."
                        disabled={loading}
                    />
                </label>

                {/* Optional: primary ticker price target */}
                <label htmlFor="price-target">
                    Price target — primary ticker (optional)
                    <StructuredThesisFields
                        value={details}
                        onChange={setDetails}
                        disabled={loading}
                    />

                    <input
                        id="price-target"
                        type="text"
                        inputMode="decimal"
                        value={priceTarget}
                        onChange={(event) =>
                            setPriceTarget(event.target.value)
                        }
                        placeholder="650.00"
                        disabled={loading}
                    />
                </label>

                {error && (
                    <p className="message error" role="alert">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="message success" role="status">
                        {success}
                    </p>
                )}

                <button
                    className="submit-button"
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? "Saving..."
                        : isEditing
                            ? "Save changes"
                            : "Publish thesis"}
                </button>

                {/* Cancel exists only when editing a post. */}
                {isEditing && (
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel editing
                    </button>
                )}
            </form>
        </section>
    );
}
