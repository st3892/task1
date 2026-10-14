"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";
const colors = ["#ad3047", "#e78caa", "#78996d", "#d5a02c", "#658ebc", "#a078b4"];
const messages = ["Nice catch, chef.", "Five-second rule!", "The frosting department approves.", "Do not eat the score."];
const clampBowl = (position: number) => Math.max(11, Math.min(89, position));
const bestKey = "whisk-takers-sprinkles-best";
const bestChanged = "whisk-takers-sprinkles-best-changed";

function readBest(): number {
  try {
    const value = Number(window.localStorage.getItem(bestKey));
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function subscribeToBest(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(bestChanged, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(bestChanged, onChange);
  };
}

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function subscribeToMotionChange(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

type Sprinkle = { kind: "normal" | "golden" | "onion"; id: number; x: number; y: number; speed: number; color: string; angle: number };

export default function CatchTheSprinkles() {
  const reducedMotion = useSyncExternalStore(subscribeToMotionChange,
    () => window.matchMedia(motionQuery).matches, () => true);
  const storedBest = useSyncExternalStore(subscribeToBest, readBest, () => 0);
  const hidden = useSyncExternalStore(subscribeToVisibility, () => document.hidden, () => true);
  const bowl = useRef(50);
  const scoreCounter = useRef(0);
  const bestCounter = useRef(0);
  const falling = useRef<Sprinkle[]>([]);
  const nextId = useRef(0);
  const deadline = useRef(0);
  const feedbackUntil = useRef(0);
  const [bowlPosition, setBowlPosition] = useState(50);
  const [sprinkles, setSprinkles] = useState<Sprinkle[]>([]);
  const [score, setScore] = useState(0);
  const [localBest, setLocalBest] = useState(0);
  const [running, setRunning] = useState(false);
  const [batch, setBatch] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [complete, setComplete] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [badCatch, setBadCatch] = useState<number | null>(null);
  const best = Math.max(storedBest, localBest);

  useEffect(() => {
    if (!running) return;
    let active = true;
    let frame = 0;
    let lastTime: number | undefined;
    let spawnTime = 450;
    let paintTime = 0;

    function finishRound() {
      if (!active) return;
      active = false;
      cancelAnimationFrame(frame);
      clearTimeout(endTimer);
      falling.current = [];
      setSprinkles([]);
      setBadCatch(null);
      setSecondsLeft(0);
      setRunning(false);
      setComplete(true);
      const previousBest = Math.max(readBest(), bestCounter.current);
      const record = scoreCounter.current > previousBest;
      setNewRecord(record);
      if (record) {
        bestCounter.current = scoreCounter.current;
        setLocalBest(scoreCounter.current);
        try {
          window.localStorage.setItem(bestKey, String(scoreCounter.current));
          window.dispatchEvent(new Event(bestChanged));
        } catch {
          // Keep the in-memory record when browser storage is unavailable.
        }
      }
    }
    // A deadline also ends the round when animation frames are suspended in a hidden tab.
    const endTimer = setTimeout(finishRound, Math.max(0, deadline.current - performance.now()));

    function animate(time: number) {
      if (!active) return;
      if (time >= deadline.current) {
        finishRound();
        return;
      }
      setSecondsLeft(Math.max(0, Math.ceil((deadline.current - time) / 1000)));
      // Cap elapsed time after a background-tab pause, avoiding a burst on return.
      const elapsed = lastTime === undefined ? 0 : Math.min(time - lastTime, 50);
      lastTime = time;
      spawnTime += elapsed;
      paintTime += elapsed;
      if (spawnTime >= 450) {
        spawnTime = 0;
        const roll = Math.random();
        const kind = roll < 0.12 ? "onion" : roll < 0.24 ? "golden" : "normal";
        falling.current.push({ kind, id: nextId.current++, x: 5 + Math.random() * 90, y: -5,
          speed: 28 + Math.random() * 12, color: colors[Math.floor(Math.random() * colors.length)],
          angle: Math.random() * 140 - 70 });
      }
      let scoreChanged = false;
      falling.current = falling.current.filter((sprinkle) => {
        const previousY = sprinkle.y;
        sprinkle.y += sprinkle.speed * elapsed / 1000;
        if (previousY < 76 && sprinkle.y >= 76 && Math.abs(sprinkle.x - bowl.current) <= 11) {
          const points = sprinkle.kind === "onion" ? -3 : sprinkle.kind === "golden" ? 3 : 1;
          scoreCounter.current = Math.max(0, scoreCounter.current + points);
          scoreChanged = true;
          if (sprinkle.kind === "onion") {
            setBadCatch(sprinkle.id);
            feedbackUntil.current = time + 900;
          }
          return false;
        }
        return sprinkle.y < 105;
      });
      if (scoreChanged) setScore(scoreCounter.current);
      if (feedbackUntil.current > 0 && time >= feedbackUntil.current) {
        feedbackUntil.current = 0;
        setBadCatch(null);
      }
      // Limit React updates to about 30fps; keep the request on its normal path.
      if (paintTime >= 33) {
        paintTime = 0;
        setSprinkles(falling.current.map((sprinkle) => ({ ...sprinkle })));
      }
      frame = requestAnimationFrame(animate);
    }
    if (!hidden && !reducedMotion) frame = requestAnimationFrame(animate);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      clearTimeout(endTimer);
    };
  }, [reducedMotion, running, hidden, batch]);

  function restart() {
    scoreCounter.current = 0;
    falling.current = [];
    nextId.current = 0;
    bowl.current = 50;
    setScore(0);
    setSprinkles([]);
    setBowlPosition(50);
    feedbackUntil.current = 0;
    deadline.current = performance.now() + 30000;
    setBadCatch(null);
    setSecondsLeft(30);
    setComplete(false);
    setNewRecord(false);
    setRunning(true);
    setBatch((current) => current + 1);
  }

  function moveBowl(position: number) {
    bowl.current = clampBowl(position);
    setBowlPosition(bowl.current);
  }

  function moveWithPointer(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width) moveBowl((event.clientX - bounds.left) / bounds.width * 100);
  }

  return (
    <section className="card sprinkle-game" aria-label="Catch the Sprinkles">
      <div className="sprinkle-game-heading">
        <div><span className="eyebrow">A LITTLE KITCHEN PLAYTIME</span><h3>Catch the Sprinkles</h3></div>
      </div>
      {reducedMotion ? (
        <p className="sprinkle-static" role="status">The sprinkles are taking a little break. Enjoy a quiet corner of the kitchen.</p>
      ) : (
        <>
          <div className="sprinkle-scoreboard">
            <p className="sprinkle-score">This batch: <strong>{score}</strong></p>
            <p className="sprinkle-score">Best batch: <strong>{best}</strong></p>
            <p className="sprinkle-score sprinkle-time">Time: <strong>00:{String(secondsLeft).padStart(2, "0")}</strong></p>
          </div>
          <div className="sprinkle-tray" tabIndex={0} role="group" aria-label="Catch sprinkles with the bowl. Use left and right arrow keys, mouse, or touch. Avoid onions."
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              moveBowl(bowl.current + (event.key === "ArrowLeft" ? -6 : 6));
            }}
            onPointerDown={(event) => {
              event.currentTarget.focus({ preventScroll: true });
              event.currentTarget.setPointerCapture(event.pointerId);
              moveWithPointer(event);
            }}
            onPointerMove={(event) => {
              if (event.pointerType === "mouse" || event.buttons > 0) moveWithPointer(event);
            }}>
            {!running && <span className="sprinkle-round-note">{complete ? "Batch complete!" : "Ready, chef?"}</span>}
            {sprinkles.map((sprinkle) => <span key={sprinkle.id} className={`falling-sprinkle sprinkle-${sprinkle.kind}`} aria-hidden="true"
              style={{ left: `${sprinkle.x}%`, top: `${sprinkle.y}%`, background: sprinkle.kind === "normal" ? sprinkle.color : undefined,
                transform: `translate(-50%, -50%) rotate(${sprinkle.kind === "onion" ? 0 : sprinkle.angle}deg)` }}>
              {sprinkle.kind === "onion" && <svg viewBox="0 0 28 32" focusable="false"><path d="m14 8-3-6m3 6 4-6" fill="none" stroke="#597050" strokeWidth="3" strokeLinecap="round" /><path d="M14 7C11 12 3 12 3 21c0 12 22 12 22 0 0-9-8-9-11-14Z" fill="#dec397" stroke="#775349" strokeWidth="2" /><path d="M14 11c-8 12-7 17 0 18m0-18c8 12 7 17 0 18" fill="none" stroke="#a4754d" strokeWidth="1.5" /></svg>}
            </span>)}
            <div key={badCatch ?? "bowl"} className={badCatch === null ? "sprinkle-bowl" : "sprinkle-bowl sprinkle-bowl-ew"} aria-hidden="true" style={{ left: `${bowlPosition}%` }}><span /></div>
            {badCatch !== null && <span className="sprinkle-ew">EW! Wrong ingredient!</span>}
          </div>
          <div className="sprinkle-game-controls">
            <button type="button" className="button button-small" onClick={restart}>{complete ? "Bake another batch" : "New batch"}</button>
          </div>
          <p className="sprinkle-chef-note" role="status">{complete ? (newRecord ? "Batch complete! New kitchen record!" : "Batch complete! Fresh round, chef?") : score > 0 ? messages[Math.floor(score / 3) % messages.length] : "All the fun. None of the washing up."}</p>
          <div className="sprinkle-legend" aria-label="Scoring"><span><i className="legend-sprinkle" aria-hidden="true" /> +1</span><span><i className="legend-golden" aria-hidden="true" /> +3</span><span>Onion −3</span></div>
        </>
      )}
    </section>
  );
}
