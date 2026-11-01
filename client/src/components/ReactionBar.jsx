
/**
 * ThesisHub — Reaction Bar
 *
 * Displays five reaction options and their counts.
 *
 * Guests can view reactions.
 * Authenticated users can:
 * - Select a reaction
 * - Change their reaction
 * - Remove a reaction by clicking it again
 *
 * The database guarantees one reaction per user per post.
 */

import { useCallback, useEffect, useState } from "react";

const REACTIONS = [
    { type: "ROCKET", emoji: "🚀", label: "TO THE MOON" },
    { type: "BULLISH", emoji: "🐂", label: "Bullish" },
    { type: "NEUTRAL", emoji: "⚖️", label: "Neutral" },
    { type: "BEARISH", emoji: "🐻", label: "Bearish" },
    { type: "BAG_HOLDER", emoji: "👜", label: "Bag Holder" },
];

const EMPTY_COUNTS = {
    ROCKET: 0,
    BULLISH: 0,
    NEUTRAL: 0,
    BEARISH: 0,
    BAG_HOLDER: 0,
};

export default function ReactionBar({
    apiUrl,
    postId,
    token,
}) {
    const [counts, setCounts] = useState(EMPTY_COUNTS);
    const [myReaction, setMyReaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    /**
     * Retrieve counts and the current user's selection.
     *
     * The GET endpoint is public, but supplying a JWT
     * allows the backend to identify myReaction.
     */
    const loadReactions = useCallback(async (signal) => {
        const headers = token
            ? { Authorization: `Bearer ${token}` }
            : {};

        const response = await fetch(
            `${apiUrl}/api/posts/${postId}/reactions`,
            { headers, signal }
        );

        if (!response.ok) {
            throw new Error("Could not load reactions.");
        }

        const data = await response.json();

        if (!data.counts) {
            throw new Error("Unexpected reactions response.");
        }

        return data;
    }, [apiUrl, postId, token]);

    useEffect(() => {
        const controller = new AbortController();

        async function initialize() {
            setLoading(true);
            setError("");

            try {
                const data = await loadReactions(controller.signal);

                if (!controller.signal.aborted) {
                    setCounts(data.counts);
                    setMyReaction(data.myReaction);
                }

            } catch {
                if (!controller.signal.aborted) {
                    setError("Reactions unavailable.");
                }

            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        initialize();

        return () => controller.abort();
    }, [loadReactions]);

    /**
     * Select or remove a reaction.
     *
     * PUT creates/changes the user's reaction.
     * DELETE removes it when clicking the selected type.
     *
     * After either operation, reload authoritative counts.
     */
    async function handleReaction(type) {
        if (!token || saving) return;

        setSaving(true);
        setError("");

        const removing = myReaction === type;

        try {
            const response = await fetch(
                `${apiUrl}/api/posts/${postId}/reaction`,
                {
                    method: removing ? "DELETE" : "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        ...(removing
                            ? {}
                            : { "Content-Type": "application/json" }),
                    },
                    ...(removing
                        ? {}
                        : { body: JSON.stringify({ type }) }),
                }
            );

            if (!response.ok) {
                const data = await response
                    .json()
                    .catch(() => ({}));

                throw new Error(
                    data.error || "Could not update reaction."
                );
            }

            const updated = await loadReactions();

            setCounts(updated.counts);
            setMyReaction(updated.myReaction);

        } catch (caughtError) {
            setError(caughtError.message);

        } finally {
            setSaving(false);
        }
    }

    const total = Object.values(counts).reduce(
        (sum, count) => sum + count,
        0
    );

    return (
        <section
            className="reaction-bar"
            aria-label="Investment thesis reactions"
        >
            <div className="reaction-heading">
                <strong>Community sentiment</strong>
                <span>{total} reactions</span>
            </div>

            {loading && (
                <p className="field-hint">Loading reactions...</p>
            )}

            {!loading && (
                <div className="reaction-buttons">
                    {REACTIONS.map(({ type, emoji, label }) => (
                        <button
                            key={type}
                            type="button"
                            className={
                                myReaction === type
                                    ? "reaction-button selected"
                                    : "reaction-button"
                            }
                            aria-pressed={myReaction === type}
                            disabled={!token || saving}
                            title={
                                !token
                                    ? "Log in to react"
                                    : label
                            }
                            onClick={() => handleReaction(type)}
                        >
                            <span aria-hidden="true">{emoji}</span>
                            <span>{label}</span>
                            <strong>{counts[type] ?? 0}</strong>
                        </button>
                    ))}
                </div>
            )}

            {!token && !loading && (
                <p className="field-hint">
                    Log in to share your sentiment.
                </p>
            )}

            {error && (
                <p className="message error" role="alert">
                    {error}
                </p>
            )}
        </section>
    );
}
