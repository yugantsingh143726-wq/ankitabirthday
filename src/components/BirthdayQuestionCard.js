"use client";
import { useEffect, useState } from "react";
import { site } from "../content/site";
import WelcomeCharacterScene from "./WelcomeCharacterScene";

export default function BirthdayQuestionCard({ onYes }) {
  const [noCount, setNoCount] = useState(0);
  const [happy, setHappy] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [reduced, setReduced] = useState(false);

   const [intro, setIntro] = useState(true);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const id = setTimeout(() => setIntro(false), 2500);
    return () => clearTimeout(id);
  }, []);

  const w = site.welcome;
const mood = happy ? "happy" : noCount > 0 ? "sad" : intro ? "dance" : "idle";

  let message = "";
  if (happy) message = w.happyReply;
  else if (noCount === 1) message = w.sadReply;
  else if (noCount > 1)
    message = reduced
      ? w.reducedMotionNo
      : w.dodgeReplies[(noCount - 2) % w.dodgeReplies.length];

  function moveNo() {
    if (reduced) return;
    setOffset({
      x: Math.round((Math.random() - 0.5) * 220),
      y: Math.round((Math.random() - 0.5) * 160),
    });
  }

  function handleNo() {
    if (happy) return;
    setNoCount((c) => c + 1);
    if (noCount >= 1) moveNo();
  }

  function handleYes() {
    if (happy) return;
    setHappy(true);
    setOffset({ x: 0, y: 0 });
    setTimeout(onYes, 1600);
  }

  return (
    <main className="question">
      <div className="question-card">
                       <WelcomeCharacterScene mood={mood} noCount={noCount} />
        <h1>{w.line1}</h1>
        <p className="question-sub">{w.line2}</p>
        <p className="question-msg" aria-live="polite">{message}</p>
        <div className="question-buttons">
          <button className="btn-yes" onClick={handleYes}>{w.yes}</button>
          <button
            className="btn-no"
            onClick={handleNo}
            onPointerEnter={() => noCount >= 1 && moveNo()}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
          >
            {w.no}
          </button>
        </div>
      </div>
    </main>
  );
}