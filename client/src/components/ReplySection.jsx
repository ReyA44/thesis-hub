
/**
 * ThesisHub — Replies Section
 *
 * Public:
 * - View all replies.
 * - View previous versions of edited replies.
 *
 * Authenticated users:
 * - Create one reply per thesis.
 * - Edit their reply (previous content is preserved).
 * - Delete their reply after confirmation.
 *
 * All authorization is enforced by Express.
 */

import { useCallback, useEffect, useState } from "react";

const MAX_LENGTH = 3000;

export default function ReplySection({
    apiUrl,
    postId,
    session,
}) {
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [content, setContent] = useState("");
    const [editing, setEditing] = useState(false);

    // Track which public reply histories are expanded.
    const [expandedIds, setExpandedIds] = useState([]);

    const userId = session?.user?.id ?? null;
    const token = session?.token ?? null;

    // Find the signed-in user's existing reply, if any.
    const myReply = replies.find(
        (reply) => reply.userId === userId
    );

    /**
     * Fetch the public reply collection.
     */
    const loadReplies = useCallback(
        async (signal) => {
            const response = await fetch(
                `${apiUrl}/api/posts/${postId}/replies`,
                { signal }
            );

            if (!response.ok) {
                throw new Error("Could not load replies.");
            }

            const data = await response.json();

            if (!Array.isArray(data.replies)) {
                throw new Error("Unexpected replies response.");
            }

            return data.replies;
        },
        [apiUrl, postId]
    );

    /**
     * Initial loading, and cleanup when the post changes.
     */
    useEffect(() => {
        const controller = new AbortController();

        async function initialize() {
            setLoading(true);
            setError("");

            try {
                const data = await loadReplies(controller.signal);

                if (!controller.signal.aborted) {
                    setReplies(data);
                }

            } catch {
                if (!controller.signal.aborted) {
                    setError("Replies unavailable.");
                }

            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        initialize();

        return () => controller.abort();

    }, [loadReplies]);

    /**
     * Refresh replies after an operation.
     */
    async function refreshReplies() {
        const data = await loadReplies();
        setReplies(data);
    }

    /**
     * Create or update the user's reply.
     */
    async function handleSubmit(event) {
        event.preventDefault();

        if (!token || saving) return;

        const cleanContent = content.trim();

        if (
            cleanContent.length === 0 ||
            cleanContent.length > MAX_LENGTH
        ) {
            setError("Reply must contain 1-3000 characters.");
            return;
        }

        setSaving(true);
        setError("");

        const method = myReply ? "PATCH" : "POST";

        try {
            const response = await fetch(
                `${apiUrl}/api/posts/${postId}/reply`,
                {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        content: cleanContent,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response
                    .json()
                    .catch(() => ({}));

                throw new Error(
                    data.error || "Could not save reply."
                );
            }

            await refreshReplies();

            setContent("");
            setEditing(false);

        } catch (caughtError) {
            setError(caughtError.message);

        } finally {
            setSaving(false);
        }
    }

    /**
     * Begin editing the existing reply.
     */
    function startEditing() {
        if (!myReply) return;

        setContent(myReply.content);
        setEditing(true);
        setError("");
    }

    /**
     * Cancel without changing the stored reply.
     */
    function cancelEditing() {
        setContent("");
        setEditing(false);
        setError("");
    }

    /**
     * Delete the current user's reply.
     */
    async function handleDelete() {
        if (!myReply || !token || saving) return;

        const confirmed = window.confirm(
            "Permanently delete your reply and its edit history?"
        );

        if (!confirmed) return;

        setSaving(true);
        setError("");

        try {
            const response = await fetch(
                `${apiUrl}/api/posts/${postId}/reply`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const data = await response
                    .json()
                    .catch(() => ({}));

                throw new Error(
                    data.error || "Could not delete reply."
                );
            }

            await refreshReplies();

            setContent("");
            setEditing(false);

        } catch (caughtError) {
            setError(caughtError.message);

        } finally {
            setSaving(false);
        }
    }

    /**
     * Expand or collapse a reply's edit history.
     */
    function toggleHistory(replyId) {
        setExpandedIds((current) =>
            current.includes(replyId)
                ? current.filter((id) => id !== replyId)
                : [...current, replyId]
        );
    }

    return (
        <section className="reply-section">
            <h4>Discussion ({replies.length})</h4>

            {loading && (
                <p className="field-hint">
                    Loading replies...
                </p>
            )}

            {error && (
                <p className="message error" role="alert">
                    {error}
                </p>
            )}

            {!loading && replies.length === 0 && (
                <p className="field-hint">
                    No replies yet. Start the discussion!
                </p>
            )}

            {/* Public replies and their edit histories. */}
            {!loading && replies.map((reply) => {
                const isMine = reply.userId === userId;

                return (
                    <article
                        key={reply.id}
                        className="reply-card"
                    >
                        <div className="post-topline">
                            <strong>
                                @{reply.user.username}
                            </strong>

                            <time dateTime={reply.createdAt}>
                                {new Date(
                                    reply.createdAt
                                ).toLocaleString()}
                            </time>
                        </div>

                        <p className="reply-content">
                            {reply.content}
                        </p>

                        {reply.revisions.length > 0 && (
                            <div className="reply-history">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        toggleHistory(reply.id)
                                    }
                                >
                                    {expandedIds.includes(reply.id)
                                        ? "Hide edit history"
                                        : `View edit history (${reply.revisions.length})`}
                                </button>

                                {expandedIds.includes(reply.id) && (
                                    <ol>
                                        {reply.revisions.map(
                                            (revision) => (
                                                <li key={revision.id}>
                                                    <small>
                                                        {new Date(
                                                            revision.createdAt
                                                        ).toLocaleString()}
                                                    </small>

                                                    <p>
                                                        {revision.content}
                                                    </p>
                                                </li>
                                            )
                                        )}
                                    </ol>
                                )}
                            </div>
                        )}

                        {/* Only the author can manage this reply. */}
                        {isMine && !editing && (
                            <div className="reply-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={startEditing}
                                    disabled={saving}
                                >
                                    Edit reply
                                </button>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={handleDelete}
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Deleting..."
                                        : "Delete reply"}
                                </button>
                            </div>
                        )}
                    </article>
                );
            })}

            {/* One reply per user per thesis. */}
            {token && !loading && (!myReply || editing) && (
                <form
                    className="reply-form"
                    onSubmit={handleSubmit}
                >
                    <label>
                        {editing
                            ? "Edit your reply"
                            : "Add your reply"}

                        <textarea
                            value={content}
                            onChange={(event) =>
                                setContent(event.target.value)
                            }
                            maxLength={MAX_LENGTH}
                            rows={4}
                            required
                            disabled={saving}
                            placeholder="Share your reasoning or counterargument..."
                        />
                    </label>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={saving || !content.trim()}
                    >
                        {saving
                            ? "Saving..."
                            : editing
                                ? "Save changes"
                                : "Post reply"}
                    </button>

                    {editing && (
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={cancelEditing}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                    )}
                </form>
            )}

            {!token && !loading && (
                <p className="field-hint">
                    Log in to participate in the discussion.
                </p>
            )}
        </section>
    );
}
