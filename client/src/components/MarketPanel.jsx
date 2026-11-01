
/**
 * ThesisHub — Market Information
 *
 * Displays the primary stock's Yahoo Finance quote and
 * price-target upside/downside from our Express API.
 *
 * TradingView is loaded only when the user opens a chart.
 * The widget is a third-party embed, not a data API.
 */

import { useEffect, useRef, useState } from "react";

export default function MarketPanel({
    apiUrl,
    ticker,
    priceTarget,
}) {
    const [market, setMarket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showChart, setShowChart] = useState(false);
    const [range, setRange] = useState("12M");

    const chartRef = useRef(null);

    /**
     * Retrieve the latest cached market quote.
     * An unavailable Yahoo quote does not affect the post.
     */
    useEffect(() => {
        const controller = new AbortController();

        async function loadMarket() {
            setLoading(true);
            setError("");
            setMarket(null);

            try {
                const query = new URLSearchParams();

                if (priceTarget != null) {
                    query.set("target", String(priceTarget));
                }

                const suffix = query.toString()
                    ? `?${query.toString()}`
                    : "";

                const response = await fetch(
                    `${apiUrl}/api/market/${encodeURIComponent(ticker)}${suffix}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error("Price unavailable");
                }

                setMarket(await response.json());
            } catch {
                if (!controller.signal.aborted) {
                    setError("Market data unavailable.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadMarket();
        return () => controller.abort();

    }, [apiUrl, ticker, priceTarget]);

    /**
     * Mount the TradingView embed.
     *
     * The external widget script generates an iframe.
     * Changing the range rebuilds the widget.
     */
    useEffect(() => {
        if (!showChart || !chartRef.current) {
            return;
        }

        const container = chartRef.current;
        container.replaceChildren();

        const widget = document.createElement("div");
        widget.className = "tradingview-widget-container__widget";
        widget.style.height = "100%";
        widget.style.width = "100%";
        container.appendChild(widget);

        const script = document.createElement("script");
        script.src =
            "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;

        /**
         * For this MVP we use the ticker without an
         * exchange prefix. TradingView resolves it.
         *
         * Its symbol resolution can be ambiguous for
         * tickers shared by multiple exchanges.
         */
        script.textContent = JSON.stringify({
            autosize: true,
            symbol: ticker,
            interval: "D",
            range,
            timezone: "Etc/UTC",
            theme: "light",
            style: "1",
            locale: "en",
            allow_symbol_change: false,
            hide_top_toolbar: true,
            hide_side_toolbar: true,
            hide_volume: true,
            withdateranges: true,
            support_host: "https://www.tradingview.com",
        });

        container.appendChild(script);

        return () => {
            container.replaceChildren();
        };

    }, [ticker, showChart, range]);

    const currency = market?.currency ?? "USD";

    function formatPrice(value) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(value);
    }

    return (
        <section
            className="market-panel"
            aria-label={`${ticker} market information`}
        >
            {loading && (
                <p className="field-hint">
                    Loading {ticker} price...
                </p>
            )}

            {error && (
                <p className="field-hint">
                    {error}
                </p>
            )}

            {market && (
                <>
                    <div className="market-stats">
                        <div>
                            <small>Last available price</small>
                            <strong>
                                {formatPrice(market.price)}
                            </strong>
                        </div>

                        {market.priceTarget != null && (
                            <>
                                <div>
                                    <small>Price target</small>
                                    <strong>
                                        {formatPrice(
                                            market.priceTarget
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <small>Target upside / downside</small>
                                    <strong>
                                        {market.upsidePercent > 0
                                            ? "+"
                                            : ""}
                                        {market.upsidePercent}%
                                    </strong>
                                </div>
                            </>
                        )}
                    </div>

                    <p className="field-hint">
                        Price as of{" "}
                        {market.priceTime
                            ? new Date(
                                market.priceTime
                            ).toLocaleString()
                            : "date unavailable"}
                        {market.stale
                            ? " — cached, possibly outdated"
                            : ""}
                    </p>
                </>
            )}

            <button
                type="button"
                className="secondary-button"
                onClick={() => setShowChart((current) => !current)}
            >
                {showChart ? "Hide chart" : "Show chart"}
            </button>

            {showChart && (
                <div className="market-chart-section">
                    <div className="market-range-controls">
                        <button
                            type="button"
                            className="secondary-button"
                            aria-pressed={range === "YTD"}
                            onClick={() => setRange("YTD")}
                        >
                            YTD
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            aria-pressed={range === "12M"}
                            onClick={() => setRange("12M")}
                        >
                            1Y
                        </button>
                    </div>

                    <div
                        ref={chartRef}
                        className="market-chart tradingview-widget-container"
                    />

                    <p className="market-attribution">
                        Chart by{" "}
                        <a
                            href="https://www.tradingview.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            TradingView
                        </a>
                    </p>
                </div>
            )}
        </section>
    );
}
