
/**
 * ThesisHub — Public Investment Thesis Feed
 *
 * Responsibilities:
 * 1. Retrieve and display public investment theses.
 * 2. Show Edit and Delete actions to post authors only.
 * 3. Reuse ThesisForm to edit existing posts.
 * 4. Confirm and execute post deletion.
 * 5. Refresh the feed after changes.
 *
 * Important:
 * Hiding controls is only a UI convenience.
 * The Express backend must enforce authorization.
 */
import ReplySection from "./ReplySection.jsx";
import ReactionBar from "./ReactionBar.jsx";
import MarketPanel from "./MarketPanel.jsx";
import { useEffect, useState } from "react";
import ThesisForm from "./ThesisForm.jsx";

export default function ThesisFeed({
    apiUrl,
    refreshKey,
    session,
    onPostsChanged,
}) {
    // Public feed data.
    const [posts, setPosts] = useState([]);

    // Request states.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Post-management states.
    const [editingPostId, setEditingPostId] = useState(null);
    const [deletingPostId, setDeletingPostId] = useState(null);
    const [actionError, setActionError] = useState("");

    /**
     * Reload posts whenever refreshKey changes.
     *
     * AbortController prevents outdated requests
     * from modifying component state.
     */
    useEffect(() => {
        const controller = new AbortController();

        async function loadPosts() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(
                    `${apiUrl}/api/posts`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error(
                        "Could not retrieve investment theses."
                    );
                }

                const data = await response.json();

                if (!Array.isArray(data.posts)) {
                    throw new Error("Unexpected feed response.");
                }

                setPosts(data.posts);

            } catch (caughtError) {
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

        return () => controller.abort();

    }, [apiUrl, refreshKey]);

    /**
     * Open the editing form for a specific post.
     */
    function startEditing(postId) {
        setActionError("");
        setEditingPostId(postId);
    }

    /**
     * Close the editing form without submitting.
     */
    function cancelEditing() {
        setEditingPostId(null);
        setActionError("");
    }

    /**
     * Called after ThesisForm successfully saves an edit.
     */
    function handleEdited() {
        setEditingPostId(null);
        setActionError("");
        onPostsChanged();
    }

    /**
     * Delete a post after the author confirms.
     *
     * The DELETE endpoint returns HTTP 204, which has
     * no JSON body. Therefore, we don't call
     * response.json() on successful deletion.
     */
    async function handleDelete(post) {
        if (!session?.token) {
            setActionError("Please log in again.");
            return;
        }

        // Confirm the destructive operation.
        const confirmed = window.confirm(
            `Permanently delete this investment thesis?\n\n"${post.title}"`
        );

        if (!confirmed) {
            return;
        }

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
                // Error responses contain JSON.
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
                        "You are not authorized to delete this thesis."
                    );
                }

                throw new Error(
                    data.error || "Could not delete thesis."
                );
            }

            // Close any editor associated with this post.
            if (editingPostId === post.id) {
                setEditingPostId(null);
            }

            // Reload the feed to remove the deleted post.
            onPostsChanged();

        } catch (caughtError) {
            setActionError(
                caughtError.message || "Unable to contact the server."
            );

        } finally {
            setDeletingPostId(null);
        }
    }

    return (
        <section className="feed" aria-label="Public thesis feed">
            <h2>Investment theses</h2>

            <p className="feed-subtitle">
                Ideas shared by the ThesisHub community
            </p>

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
                    No theses have been published yet.
                    Be the first to share an idea!
                </p>
            )}

            {!loading && !error && posts.map((post) => {
                /**
                 * Only the author sees editing controls.
                 *
                 * Ownership is checked again in the backend
                 * before any data is modified.
                 */
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

                        {/* Post-management controls. */}
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

                        {/* The existing form doubles as an editor. */}
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

                        <p className="conviction-label">
                            Conviction:{" "}
                            <strong>
                                {post.conviction}
                            </strong>
                        </p>

                        {/* Stock relationships arrive in order. */}
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

                        {/* Optional post details. */}
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
                        {/* Live-on-request market information for primary ticker. */}
                        {post.stocks.length > 0 && (
                            <MarketPanel
                                key={post.stocks[0].stock.ticker}
                                apiUrl={apiUrl}
                                ticker={post.stocks[0].stock.ticker}
                                priceTarget={post.priceTarget}
                            />
                        )}
                        <ReactionBar
                            apiUrl={apiUrl}
                            postId={post.id}
                            token={session?.token}
                        />
                        <ReplySection
                            apiUrl={apiUrl}
                            postId={post.id}
                            session={session}
                        />
                    </article>
                );
            })}
        </section>
    );
}
