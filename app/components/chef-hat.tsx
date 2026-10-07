"use client";

import { useEffect, useRef, useState } from "react";

export default function ChefHat() {
  const taps = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);

  function tap() {
    if (++taps.current < 4) return;
    taps.current = 0;
    setRevealed(true);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setRevealed(false), 3500);
  }

  return (
    <div className="chef-hat-egg">
      <button type="button" className="chef-hat" onClick={tap} aria-label="Tap the chef hat">
        <svg viewBox="0 0 80 70" aria-hidden="true"><path d="M20 43C0 43 2 16 20 16c3-19 32-19 37 0 20-3 26 26 3 29v17H20Z" fill="#fffdf9" stroke="#7d5347" strokeWidth="2.5" strokeLinejoin="round" /><path d="M20 50h40M31 28v12m17-12v12" stroke="#e2b7a6" strokeWidth="3" strokeLinecap="round" /></svg>
      </button>
      <p className="chef-secret" role="status">{revealed ? "Certified to operate a whisk." : ""}</p>
    </div>
  );
}
