
/**
 * ThesisHub — Thesis Publishing Form
 *
 * Responsibilities:
 * 1. Collect structured investment-thesis information.
 * 2. Support one or more stock tickers.
 * 3. Submit authenticated POST requests.
 * 4. Display loading, success, and error messages.
 *
 * Props:
 * apiUrl      — Base address of the Express backend.
 * token       — JWT belonging to the logged-in user.
 * onPublished — Callback executed after successful publishing.
 */

import { useRef, useState } from "react";

export default function ThesisForm({
    apiUrl,
    token,
    onPublished,
}) {
    // Required thesis fields.
    const [title, setTitle] = useState("");
    const [conviction, setConviction] = useState("MEDIUM");

    // Optional thesis fields.
    const [fullThesis, setFullThesis] = useState("");
    const [priceTarget, setPriceTarget] = useState("");

    /**
     * Each row contains a company name and stock ticker.
     *
     * 'id' is used only by React to identify the row.
     * It is not part of the API request.
     *
     * The first row represents the primary ticker.
     */
    const [stocks, setStocks] = useState([
        { id: 0, ticker: "", companyName: "" },
    ]);

    // Keeps new row IDs unique, including after removing rows.
    const nextStockId = useRef(1);

    // Form feedback.
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /**
     * Update one field in a specific stock row.
     *
     * React state is immutable:
     * map() creates a new array instead of editing
     * the existing array directly.
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
     * Add a new stock row.
     *
     * The backend currently allows a maximum of 10 stocks.
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
     * Remove a row, but always keep at least one stock.
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
     * Submit a structured thesis to our Express backend.
     */
    async function handleSubmit(event) {
        // Prevent the browser's default form submission.
        event.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        // Only authenticated users may publish.
        if (!token) {
            setError("Please log in before publishing.");
            setLoading(false);
            return;
        }

        /**
         * Build the request body expected by POST /api/posts.
         *
         * Stock order is preserved:
         * the backend assigns position 0 to the first stock.
         */
        const payload = {
            title: title.trim(),
            conviction,

            stocks: stocks.map((stock) => ({
                ticker: stock.ticker.trim().toUpperCase(),
                companyName: stock.companyName.trim(),
            })),

            fullThesis: fullThesis.trim(),

            // An empty optional target should be omitted.
            priceTarget: priceTarget.trim() || undefined,
        };

        try {
            const response = await fetch(
                `${apiUrl}/api/posts`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        // JWT proves which user is publishing.
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                // A JWT may expire while the form is open.
                if (response.status === 401) {
                    throw new Error(
                        "Your session may have expired. Log out and sign in again."
                    );
                }

                // Prefer the backend's validation message.
                throw new Error(
                    data.error || "Could not publish thesis."
                );
            }

            // Successful POST returns HTTP 201.
            // Reset the form so another thesis can be created.
            setTitle("");
            setConviction("MEDIUM");
            setFullThesis("");
            setPriceTarget("");

            setStocks([
                { id: nextStockId.current++, ticker: "", companyName: "" },
            ]);

            setSuccess("Your investment thesis was published!");

            // Notify App.jsx that the public feed needs refreshing.
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
            <h2>Publish an investment thesis</h2>

            <form
                className="thesis-form"
                onSubmit={handleSubmit}
            >
                {/* Required: short thesis title */}
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
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                    </select>
                </label>

                {/* Required: one or more stocks */}
                <fieldset className="stocks-fieldset">
                    <legend>Stocks *</legend>

                    <p className="field-hint">
                        The first stock is the primary ticker
                        used for the price target.
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
                                disabled={stocks.length === 1 || loading}
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

                {/* Optional: detailed investment thesis */}
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
                    />
                </label>

                {/* Optional: target for the primary ticker only */}
                <label htmlFor="price-target">
                    Price target — primary ticker (optional)

                    <input
                        id="price-target"
                        type="text"
                        inputMode="decimal"
                        value={priceTarget}
                        onChange={(event) =>
                            setPriceTarget(event.target.value)
                        }
                        placeholder="650.00"
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
                        ? "Publishing..."
                        : "Publish thesis"}
                </button>
            </form>
        </section>
    );
}
