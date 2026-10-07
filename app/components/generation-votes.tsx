"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/client";

type Props = {
  itemId: number;
  source: "generation" | "joke";
  userId: string | null;
  upvotes: number | null;
  downvotes: number | null;
  currentVote: 1 | -1 | null;
  onVoteChange?: (vote: 1 | -1 | null) => void;
};

export default function GenerationVotes({ itemId, source, userId, upvotes, downvotes, currentVote, onVoteChange }: Props) {
  const router = useRouter();
  const [signedOut, setSignedOut] = useState(false);
  const [pending, setPending] = useState(false);
  const [selectedVote, setSelectedVote] = useState(currentVote);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const authenticated = !!userId && !signedOut;

  useEffect(() => {
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setSignedOut(true);
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function vote(value: 1 | -1) {
    if (!authenticated || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setSignedOut(true);
        router.refresh();
        return;
      }
      if (user.id !== userId) {
        setError("Your account changed. Please refresh before voting.");
        router.refresh();
        return;
      }
      // Read the saved vote, including changes made in another tab.
      const targetColumn = source === "generation" ? "generation_id" : "joke_id";
      const { data: existingVote, error: readError } = await supabase.from("votes")
        .select("vote").eq("user_id", user.id).eq(targetColumn, itemId).maybeSingle();
      if (readError) {
        setError(`Couldn’t check your vote: ${readError.message}`);
        return;
      }

      const removeVote = existingVote?.vote === value;
      const mutation = !existingVote
        ? supabase.from("votes").insert({ user_id: user.id, generation_id: source === "generation" ? itemId : null, joke_id: source === "joke" ? itemId : null, vote: value, created_at: new Date().toISOString() })
        : removeVote
          ? supabase.from("votes").delete().eq("user_id", user.id).eq(targetColumn, itemId)
          : supabase.from("votes").update({ vote: value }).eq("user_id", user.id).eq(targetColumn, itemId);
      const { error: mutationError } = await mutation;
      if (mutationError) {
        if (mutationError.code === "23505") {
          setError("Your vote changed in another tab. Please try again.");
          router.refresh();
        } else {
          setError(`Couldn’t save your vote: ${mutationError.message}`);
        }
        return;
      }
      setSelectedVote(removeVote ? null : value);
      onVoteChange?.(removeVote ? null : value);
      router.refresh();
    } catch {
      setError("Couldn’t save your vote. Please check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <div className="generation-votes">
      <div className="vote-controls">
        <button type="button" className="button button-secondary button-small" disabled={!authenticated || pending} onClick={() => vote(1)} aria-label="Like this creation" aria-pressed={authenticated && selectedVote === 1}>👍 Like <span>{upvotes ?? "—"}</span></button>
        <button type="button" className="button button-secondary button-small" disabled={!authenticated || pending} onClick={() => vote(-1)} aria-label="Boo this creation" aria-pressed={authenticated && selectedVote === -1}>👎 Boo! <span>{downvotes ?? "—"}</span></button>
      </div>
      {(upvotes === null || downvotes === null) && <p className="small-note">Vote totals are temporarily unavailable.</p>}
      {!authenticated ? <p className="small-note"><Link href="/login">Sign in to vote.</Link></p> : pending ? <p className="small-note" role="status">Saving your vote…</p> : null}
      {error && <p className="small-note" role="alert">{error}</p>}
    </div>
  );
}
