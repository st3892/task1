"use client";

import { useEffect, useRef, useState } from "react";

export default function CherryTop() {
  const clicks = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [message, setMessage] = useState(false);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function tapCherry() {
    clicks.current++;
    if (clicks.current < 5) return;
    clicks.current = 0;
    setMessage(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(false), 4000);
  }

  return (
    <div className="dessert-top">
      <svg className="cream-swirl" viewBox="0 0 360 135" aria-hidden="true">
        <path d="M25 130C5 105 35 83 75 83c-10-28 28-47 65-43 2-22 20-29 40-38-2 27 48 20 53 45 37-6 65 14 57 35 42-4 81 28 44 48Z" fill="#fffdf9" stroke="#e7d8c5" strokeWidth="2" />
        <path d="M78 85c57 16 135 17 211-2M141 42c29 13 55 15 89 6" fill="none" stroke="#f0e4d4" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <button className="decorative-cherry" type="button" onClick={tapCherry} aria-label="Tap the decorative cherry">
        <svg viewBox="0 0 80 90" aria-hidden="true"><path d="M39 40C37 15 48 4 60 5" fill="none" stroke="#597050" strokeWidth="4" strokeLinecap="round" /><path d="M47 20c14-16 28-8 24-4-9 10-18 10-24 4" fill="#8fa27b" /><path d="M40 39c-34-15-45 37-11 44 42 13 58-40 22-45-4 0-7 1-11 1" fill="#b72e45" /><ellipse cx="25" cy="52" rx="5" ry="8" fill="#f499a4" transform="rotate(25 25 52)" /></svg>
      </button>
      <p className="cherry-message" role="status">{message ? "Okay, chef. That cherry has been through enough." : ""}</p>
    </div>
  );
}
