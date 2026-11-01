
/**
 * ThesisHub — Public Investment Thesis Feed
 *
 * Responsibilities:
 * 1. Retrieve public posts from the Express API.
 * 2. Display posts with author and stock information.
 * 3. Handle loading, errors, and an empty feed.
 * 4. Refresh when a new thesis is published.
 *
 * Props:
 * apiUrl     — Express backend base URL.
 * refreshKey — Changes whenever the feed should reload.
 */

import { useEffect, useState } from "react";

export default function ThesisFeed({
    apiUrl,
    refreshKey,
}) {
    // Store the collection of posts returned by the backend.
    const [posts, setPosts] = useState([]);

    // Track request progress and errors.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /**
     * Fetch the public feed.
     *
     * The effect also runs when refreshKey changes.
     * AbortController cancels obsolete requests during
     * unmounting or subsequent refreshes.
     */
    useEffect(() => {
        const controller = new AbortController();

        async function loadPosts() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(
                    `${apiUrl}/api/posts`,
                    {
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Could not retrieve investment theses."
                    );
                }

                const data = await response.json();

                // Validate the expected top-level response shape.
                if (!Array.isArray(data.posts)) {
                    throw new Error("Unexpected feed response.");
                }

                setPosts(data.posts);

            } catch (caughtError) {
                // Ignore errors caused by cancelled requests.
                if (!controller.signal.aborted) {
                    setError(caughtError.message);
                }

            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadPosts();

        // Cleanup prevents obsolete fetches from updating state.
        return () => controller.abort();

    }, [apiUrl, refreshKey]);

    return (
        <section className="feed" aria-label="Public thesis feed">
            <h2>Investment theses</h2>

            <p className="feed-subtitle">
                Ideas shared by the ThesisHub community
            </p>

            {/* Show progress while requesting the feed. */}
            {loading && (
                <p role="status">
                    Loading investment theses...
                </p>
            )}

            {/* Show an error if the request fails. */}
            {error && (
                <p className="message error" role="alert">
                    {error}
                </p>
            )}

            {/* Empty states are distinct from request failures. */}
            {!loading && !error && posts.length === 0 && (
                <p className="empty-feed">
                    No theses have been published yet.
                    Be the first to share an idea!
                </p>
            )}

            {/* Display the retrieved posts. */}
            {!loading && !error && posts.map((post) => (
                <article
                    key={post.id}
                    className="post-card"
                >
                    <div className="post-topline">
                        <strong>
                            @{post.author.username}
                        </strong>

                        <time dateTime={post.createdAt}>
                            {new Date(post.createdAt).toLocaleString()}
                        </time>
                    </div>

                    <h3 className="post-title">
                        {post.title}
                    </h3>

                    <p className="conviction-label">
                        Conviction: <strong>{post.conviction}</strong>
                    </p>

                    {/* The API returns stock relationships ordered
              by their position within the thesis. */}
                    <ul className="post-stocks">
                        {post.stocks.map((association, index) => (
                            <li key={association.id}>
                                <strong>
                                    {association.stock.ticker}
                                </strong>

                                <span>
                                    {association.stock.companyName}
                                </span>

                                {index === 0 && (
                                    <span className="primary-ticker">
                                        Primary
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* Display optional information only when present. */}
                    {post.fullThesis && (
                        <p className="post-description">
                            {post.fullThesis}
                        </p>
                    )}

                    {post.priceTarget != null && (
                        <p className="post-target">
                            Price target for primary ticker:{" "}
                            <strong>
                                {post.priceTarget}
                            </strong>
                        </p>
                    )}
                </article>
            ))}
        </section>
    );
}
