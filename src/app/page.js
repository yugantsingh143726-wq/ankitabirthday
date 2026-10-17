"use client";
import { useCallback, useEffect, useState } from "react";
import BirthYearGate from "../components/BirthYearGate";
import BirthdayQuestionCard from "../components/BirthdayQuestionCard";
import MemoryLoader from "../components/MemoryLoader";
import HeroScene from "../components/HeroScene";
import IncomingCall from "../components/Incomingcall";
import MemoryAlbum from "../components/MemoryAlbum";
import CandlesLetter from "../components/CandlesLetter";
import SoundToggle from "../components/SoundToggle";
import OpeningBackdrop from "../components/OpeningBackdrop";
import { site } from "../content/site";

// Flow gates: each stage only opens after the previous one is completed,
// so nothing can be skipped by scrolling.
// gate -> question -> loader -> hero -> call -> album -> candles
export default function Home() {
  const [stage, setStage] = useState("gate");
  const loaderDone = useCallback(() => setStage("hero"), []);

  // Replay resets the entire flow (unmounting also stops camera/mic/audio)
  const replay = useCallback(() => {
    window.scrollTo(0, 0);
    setStage("gate");
  }, []);

  // CSS uses this to pick light/dark styling for the tag and sound button
  useEffect(() => {
    document.body.dataset.stage = stage;
    return () => {
      delete document.body.dataset.stage;
    };
  }, [stage]);

  let view;
  if (stage === "gate") {
    view = <BirthYearGate onSuccess={() => setStage("question")} />;
  } else if (stage === "question") {
    view = <BirthdayQuestionCard onYes={() => setStage("loader")} />;
  } else if (stage === "loader") {
    view = <MemoryLoader onDone={loaderDone} />;
  } else if (stage === "hero") {
    view = <HeroScene onPickUp={() => setStage("call")} />;
  } else if (stage === "call") {
    view = <IncomingCall onOpenAlbum={() => setStage("album")} />;
  } else if (stage === "album") {
    view = <MemoryAlbum onWish={() => setStage("candles")} />;
  } else {
    view = <CandlesLetter onReplay={replay} />;
  }

  // Pastel glass look everywhere except the dark hero ("hold to ignite") window
  const pastel = stage !== "hero";

  // Global tag + sound toggle (the call screen has its own mute control)
  const showUi = stage === "hero" || stage === "album" || stage === "candles";

  return (
    <>
      {pastel && <OpeningBackdrop />}
      {view}
      {showUi && <div className="top-tag">{site.ui.tag}</div>}
      {showUi && <SoundToggle />}
    </>
  );
}