
/**
 * ThesisHub — Public Investment Thesis Feed
 *
 * Features:
 * - Public thesis discovery and filtering.
 * - Four feed sorting options.
 * - Post editing and deletion for authors.
 * - Stock market information.
 * - Community reactions and replies.
 *
 * Search and filtering are performed by the backend.
 * Authorization is enforced by Express.
 */

import { useEffect, useState } from "react";

import MarketPanel from "./MarketPanel.jsx";
import ReactionBar from "./ReactionBar.jsx";
import ReplySection from "./ReplySection.jsx";
import ThesisForm from "./ThesisForm.jsx";
import StructuredThesisView from "./StructuredThesisView.jsx";

const DEFAULT_FILTERS = {
    q: "",
    author: "",
    conviction: "",
    sentiment: "",
    age: "all",
    sort: "newest",
};

/**
 * Convert selected filters into API query parameters.
 */
function buildFeedUrl(apiUrl, filters) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
        if (value && value !== "all") {
            params.set(key, value);
        }
    }

    const query = params.toString();

    return `${apiUrl}/api/posts${query ? `?${query}` : ""}`;
}

export default function ThesisFeed({
    apiUrl,
    refreshKey,
    session,
    onPostsChanged,
}) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Form values may change without immediately fetching.
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    // Only submitted filters trigger an API request.
    const [appliedFilters, setAppliedFilters] =
        useState(DEFAULT_FILTERS);

    const [editingPostId, setEditingPostId] = useState(null);
    const [deletingPostId, setDeletingPostId] = useState(null);
    const [actionError, setActionError] = useState("");

    /**
     * Load matching theses.
     *
     * AbortController prevents an older request from
     * overwriting newer search results.
     */
    useEffect(() => {
        const controller = new AbortController();

        async function loadPosts() {
            setLoading(true);
            setError("");

            try {
                const url = buildFeedUrl(
                    apiUrl,
                    appliedFilters
                );

                const response = await fetch(url, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const data = await response
                        .json()
                        .catch(() => ({}));

                    throw new Error(
                        data.error ||
                        "Could not retrieve investment theses."
                    );
                }

                const data = await response.json();

                if (!Array.isArray(data.posts)) {
                    throw new Error("Unexpected feed response.");
                }

                if (!controller.signal.aborted) {
                    setPosts(data.posts);
                }

            } catch (caughtError) {
                if (!controller.signal.aborted) {
                    setError(
                        caughtError.message ||
                        "Unable to contact the server."
                    );
                }

            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadPosts();

        return () => controller.abort();

    }, [apiUrl, refreshKey, appliedFilters]);

    /**
     * Update one discovery control.
     */
    function updateFilter(name, value) {
        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    /**
     * Apply all selected filters together.
     */
    function handleSearch(event) {
        event.preventDefault();

        setAppliedFilters({ ...filters });
    }

    /**
     * Restore the initial feed.
     */
    function resetFilters() {
        setFilters({ ...DEFAULT_FILTERS });
        setAppliedFilters({ ...DEFAULT_FILTERS });
    }

    function startEditing(postId) {
        setActionError("");
        setEditingPostId(postId);
    }

    function cancelEditing() {
        setEditingPostId(null);
        setActionError("");
    }

    function handleEdited() {
        setEditingPostId(null);
        setActionError("");
        onPostsChanged();
    }

    /**
     * Delete only a post belonging to the signed-in user.
     *
     * This frontend check is for user experience.
     * The backend also verifies ownership.
     */
    async function handleDelete(post) {
        if (!session?.token) {
            setActionError("Please log in again.");
            return;
        }

        const confirmed = window.confirm(
            `Permanently delete this investment thesis?\n\n"${post.title}"`
        );

        if (!confirmed) return;

        setDeletingPostId(post.id);
        setActionError("");

        try {
            const response = await fetch(
                `${apiUrl}/api/posts/${post.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${session.token}`,
                    },
                }
            );

            if (!response.ok) {
                const data = await response
                    .json()
                    .catch(() => ({}));

                if (response.status === 401) {
                    throw new Error(
                        "Your session expired. Please log in again."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "You cannot delete another user's thesis."
                    );
                }

                throw new Error(
                    data.error || "Could not delete thesis."
                );
            }

            if (editingPostId === post.id) {
                setEditingPostId(null);
            }

            onPostsChanged();

        } catch (caughtError) {
            setActionError(
                caughtError.message ||
                "Unable to contact the server."
            );

        } finally {
            setDeletingPostId(null);
        }
    }

    return (
        <section
            className="feed"
            id="feed"
            aria-label="Public thesis feed"
        >
            <h2>Investment theses</h2>

            <p className="feed-subtitle">
                Explore investment ideas shared by the
                ThesisHub community.
            </p>

            {/* Public search and discovery controls. */}
            <form
                className="feed-filters"
                onSubmit={handleSearch}
                aria-label="Search and filter investment theses"
            >
                {/* Keep stock search and sort visible; other filters stay one click away. */}
                <div className="feed-filter-grid feed-filter-primary">
                    <label>
                        Stock / Company
                        <input
                            type="search"
                            value={filters.q}
                            onChange={(event) =>
                                updateFilter(
                                    "q",
                                    event.target.value
                                )
                            }
                            maxLength={100}
                            placeholder="MSFT, Microsoft..."
                        />
                    </label>
                    <label>
                        Sort by
                        <select
                            value={filters.sort}
                            onChange={(event) =>
                                updateFilter(
                                    "sort",
                                    event.target.value
                                )
                            }
                        >
                            <option value="newest">
                                Newest first
                            </option>
                            <option value="oldest">
                                Oldest first
                            </option>
                            <option value="popular">
                                Most popular
                            </option>
                            <option value="discussed">
                                Most discussed
                            </option>
                        </select>
                    </label>
                </div>
                <details className="feed-filter-more">
                    <summary>More filters <span>Author, conviction, sentiment & date</span></summary>
                    <div className="feed-filter-grid feed-filter-advanced">
                        <label>
                        Author
                        <input
                            type="search"
                            value={filters.author}
                            onChange={(event) =>
                                updateFilter(
                                    "author",
                                    event.target.value
                                )
                            }
                            maxLength={100}
                            placeholder="Username"
                        />
                    </label>

                        <label>
                        Conviction
                        <select
                            value={filters.conviction}
                            onChange={(event) =>
                                updateFilter(
                                    "conviction",
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                All convictions
                            </option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </label>

                        <label>
                        Community sentiment
                        <select
                            value={filters.sentiment}
                            onChange={(event) =>
                                updateFilter(
                                    "sentiment",
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                All sentiments
                            </option>
                            <option value="ROCKET">
                                🚀 TO THE MOON
                            </option>
                            <option value="BULLISH">
                                🐂 Bullish
                            </option>
                            <option value="NEUTRAL">
                                ⚖️ Neutral
                            </option>
                            <option value="BEARISH">
                                🐻 Bearish
                            </option>
                            <option value="BAG_HOLDER">
                                👜 Bag Holder
                            </option>
                        </select>
                    </label>

                        <label>
                        Published
                        <select
                            value={filters.age}
                            onChange={(event) =>
                                updateFilter(
                                    "age",
                                    event.target.value
                                )
                            }
                        >
                            <option value="all">
                                Any time
                            </option>
                            <option value="7d">
                                Last 7 days
                            </option>
                            <option value="30d">
                                Last 30 days
                            </option>
                            <option value="90d">
                                Last 90 days
                            </option>
                            <option value="365d">
                                Last year
                            </option>
                        </select>
                    </label>
                    </div>
                </details>

                <div className="feed-filter-actions">
                    <button
                        type="submit"
                        className="submit-button"
                    >
                        Apply filters
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={resetFilters}
                    >
                        Reset
                    </button>
                </div>
            </form>

            {!loading && !error && (
                <p
                    className="feed-results-count"
                    role="status"
                >
                    Showing {posts.length}{" "}
                    {posts.length === 1 ? "thesis" : "theses"}
                    {posts.length === 25
                        ? " (maximum 25 per search)"
                        : ""}
                </p>
            )}

            {loading && (
                <p role="status">
                    Loading investment theses...
                </p>
            )}

            {error && (
                <p className="message error" role="alert">
                    {error}
                </p>
            )}

            {actionError && (
                <p className="message error" role="alert">
                    {actionError}
                </p>
            )}

            {!loading && !error && posts.length === 0 && (
                <p className="empty-feed">
                    No investment theses match your filters.
                    Try different criteria or select Reset.
                </p>
            )}

            {!loading && !error && posts.map((post) => {
                // Only the author sees management controls.
                const isAuthor =
                    session?.user?.id === post.author.id;

                const isEditing = editingPostId === post.id;
                const isDeleting = deletingPostId === post.id;

                return (
                    <article
                        key={post.id}
                        className="post-card"
                    >
                        <div className="post-topline">
                            <strong>
                                @{post.author.username}
                            </strong>

                            <time dateTime={post.createdAt}>
                                {new Date(
                                    post.createdAt
                                ).toLocaleString()}
                            </time>
                        </div>

                        <h3 className="post-title">
                            {post.title}
                        </h3>

                        {/* Author-only management controls. */}
                        {isAuthor && (
                            <div className="post-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        isEditing
                                            ? cancelEditing()
                                            : startEditing(post.id)
                                    }
                                    disabled={isDeleting}
                                >
                                    {isEditing
                                        ? "Close editor"
                                        : "Edit"}
                                </button>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        handleDelete(post)
                                    }
                                    disabled={isDeleting}
                                >
                                    {isDeleting
                                        ? "Deleting..."
                                        : "Delete"}
                                </button>
                            </div>
                        )}

                        {isEditing && isAuthor && (
                            <ThesisForm
                                key={post.id}
                                apiUrl={apiUrl}
                                token={session.token}
                                editingPost={post}
                                onPublished={handleEdited}
                                onCancel={cancelEditing}
                            />
                        )}

                        <p className="conviction-label" data-level={post.conviction}>
                            Conviction:{" "}
                            <strong>
                                {post.conviction}
                            </strong>
                        </p>

                        {/* Associated stocks in priority order. */}
                        <ul className="post-stocks">
                            {post.stocks.map(
                                (association, index) => (
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
                                )
                            )}
                        </ul>

                        {post.fullThesis && (
                            <details className="post-description-disclosure">
                                <summary>Read the full thesis</summary>
                                <p className="post-description">{post.fullThesis}</p>
                            </details>
                        )}

                        {post.priceTarget != null && (
                            <p className="post-target">
                                Price target for primary ticker:{" "}
                                <strong>
                                    {post.priceTarget}
                                </strong>
                            </p>
                        )}

                        <StructuredThesisView post={post} />

                        {/* Engagement information from the feed API. */}
                        {typeof post.popularityScore === "number" && (
                            <p className="feed-engagement">
                                <span>
                                    {post.reactionCount} reactions
                                </span>
                                <span>
                                    {post.replyCount} replies
                                </span>
                                <strong>
                                    Score: {post.popularityScore}
                                </strong>
                            </p>
                        )}

                        {/* Primary ticker market information. */}
                        {post.stocks.length > 0 && (
                            <MarketPanel
                                key={post.stocks[0].stock.ticker}
                                apiUrl={apiUrl}
                                ticker={post.stocks[0].stock.ticker}
                                priceTarget={post.priceTarget}
                                priceAtPublication={post.priceAtPublication}
                                priceCapturedAt={post.priceCapturedAt}
                            />
                        )}

                        <ReactionBar
                            apiUrl={apiUrl}
                            postId={post.id}
                            token={session?.token}
                        />

                        <details className="discussion-disclosure">
                            <summary>
                                Discussion
                                <span>{post.replyCount ?? 0} replies</span>
                            </summary>
                            <ReplySection
                                apiUrl={apiUrl}
                                postId={post.id}
                                session={session}
                            />
                        </details>
                    </article>
                );
            })}
        </section>
    );
}
