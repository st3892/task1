"use client";

import { useEffect, useRef, useState } from "react";
import GenerationVotes from "./generation-votes";
import type { VotingItem } from "../../lib/voting";

export default function VotingDeck({ items, userId }: { items: VotingItem[]; userId: string }) {
  const [activeKey, setActiveKey] = useState<string | null>(() => items.find((item) => item.currentVote === null)?.key ?? null);
  const [changes, setChanges] = useState<Record<string, 1 | -1 | null>>({});
  const [feedback, setFeedback] = useState<"yum" | "boo" | "removed" | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
  }, []);
  const currentItems = items.map((item) => {
    const vote = Object.hasOwn(changes, item.key) ? changes[item.key] : item.currentVote;
    return { ...item, currentVote: vote, upvotes: item.upvotes + Number(vote === 1) - Number(item.currentVote === 1), downvotes: item.downvotes + Number(vote === -1) - Number(item.currentVote === -1) };
  });
  const unrated = currentItems.filter((item) => item.currentVote === null);
  const active = currentItems.find((item) => item.key === activeKey);

  function advance(vote: 1 | -1 | null) {
    if (!active || advanceTimer.current) return;
    setChanges((previous) => ({ ...previous, [active.key]: vote }));
    const next = currentItems.find((item) => item.key !== active.key && item.currentVote === null);
    const nextKey = next?.key ?? (vote === null ? active.key : null);
    setFeedback(vote === 1 ? "yum" : vote === -1 ? "boo" : "removed");
    advanceTimer.current = setTimeout(() => {
      setActiveKey(nextKey);
      setFeedback(null);
      advanceTimer.current = null;
      if (nextKey === null && vote !== null && items.length > 0) {
        setCelebrating(true);
        if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
        celebrationTimer.current = setTimeout(() => {
          setCelebrating(false);
          celebrationTimer.current = null;
        }, 3800);
      }
    }, vote === null ? 220 : 800);
  }

  if (!active) {
    return <div className="card empty-state batch-complete">{celebrating && <div className="rainbow-celebration" aria-hidden="true">{Array.from({ length: 48 }, (_, sprinkle) => <i key={sprinkle} style={{ left: `${(sprinkle * 37) % 100}%`, animationDelay: `${(sprinkle % 12) * 70}ms` }} />)}</div>}<div className="crumb-plate" aria-hidden="true"><span>✦</span><i /><i /><i /><b className="table-spoon" /></div><span className="eyebrow">{unrated.length ? "SECONDS, ANYONE?" : "NOT A CRUMB LEFT"}</span><h2 role="status">{unrated.length ? "More jokes are ready!" : "You tasted the whole batch!"}</h2><p>{items.length ? "Please leave the kitchen before you start rating the furniture." : "The kitchen is quiet. Cook up the first joke on Home."}</p>{items.length > 0 && <button className="button" onClick={() => setActiveKey(unrated[0]?.key ?? currentItems[0].key)}>{unrated.length ? "Keep voting" : "Review your votes"}</button>}</div>;
  }

  const index = currentItems.findIndex((item) => item.key === active.key);
  return (
    <div className="voting-deck">
      <div className="tasting-progress"><span className="eyebrow">TODAY’S BATCH</span><progress max={Math.max(items.length, 1)} value={items.length - unrated.length} aria-label="Jokes rated" /><p className="small-note">{unrated.length} {unrated.length === 1 ? "treat" : "treats"} left in the batch</p><div className="batch-sprinkles" aria-hidden="true">{Array.from({ length: 10 }, (_, dot) => <span key={dot} className={dot < Math.round((items.length - unrated.length) / Math.max(items.length, 1) * 10) ? "tasted" : ""} />)}</div></div>
      <p className="tasting-instruction">Like it? Delicious. Not your taste? Boo the chef.</p>
      <div className="tasting-stage" data-feedback={feedback}>
      <div className="counter-decor" aria-hidden="true"><span className="stage-cherry" /><span className="frosting-dollop" /><span className="table-spoon" /><span className="counter-crumb" /><span className="counter-crumb" /></div>
      <article key={active.key} className="card generation-card tasting-card" data-feedback={feedback}>
        <div className="taste-doodles" aria-hidden="true"><span>✦</span><span>✧</span><span>♡</span></div>
        <span className="verdict-stamp" aria-hidden="true">{feedback === "yum" ? "YUM!" : feedback === "boo" ? "BOO!" : ""}</span>
        {(feedback === "yum" || feedback === "boo") && <div className={`vote-particles ${feedback}`} aria-hidden="true">{Array.from({ length: 24 }, (_, sprinkle) => <i key={sprinkle} style={{ left: `${8 + (sprinkle * 19) % 84}%`, top: `${20 + (sprinkle * 13) % 45}%`, animationDelay: `${(sprinkle % 5) * 35}ms` }} />)}</div>}
        <span className="category">{active.source === "generation" ? "AI creation" : "Classic joke"}</span>
        <p className="generation-text">{active.text}</p>
        {active.prompt && <p className="generation-prompt"><strong>Prompt:</strong> {active.prompt}</p>}
        <fieldset className="taste-vote-fieldset" disabled={feedback !== null}>
          <GenerationVotes key={`${active.key}:${active.currentVote}`} itemId={active.id} source={active.source} userId={userId} upvotes={active.upvotes} downvotes={active.downvotes} currentVote={active.currentVote} onVoteChange={advance} />
        </fieldset>
        <p className="taste-reaction" role="status">{feedback === "yum" ? "YUM! Chef’s kiss! ✦" : feedback === "boo" ? "BOO! A little underbaked…" : feedback === "removed" ? "Back on the menu!" : ""}</p>
      </article>
      </div>
      <div className="member-actions">
        <button className="button button-secondary button-small" disabled={feedback !== null || index === 0} onClick={() => setActiveKey(currentItems[index - 1].key)}>← Previous treat</button>
        <button className="button button-secondary button-small" disabled={feedback !== null || index === currentItems.length - 1} onClick={() => setActiveKey(currentItems[index + 1].key)}>Next treat →</button>
      </div>
    </div>
  );
}
