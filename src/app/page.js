"use client";
import { useCallback, useState } from "react";
import BirthYearGate from "../components/BirthYearGate";
import BirthdayQuestionCard from "../components/BirthdayQuestionCard";
import MemoryLoader from "../components/MemoryLoader";
import HeroScene from "../components/HeroScene";
import { site } from "../content/site";
import IncomingCall from "../components/Incomingcall";

export default function Home() {
  const [stage, setStage] = useState("gate");
  const loaderDone = useCallback(() => setStage("hero"), []);

  if (stage === "gate") {
    return <BirthYearGate onSuccess={() => setStage("question")} />;
  }
  if (stage === "question") {
    return <BirthdayQuestionCard onYes={() => setStage("loader")} />;
  }
  if (stage === "loader") {
    return <MemoryLoader onDone={loaderDone} />;
  }
    if (stage === "hero") {
    return <HeroScene onPickUp={() => setStage("call")} />;
  }
    if (stage === "call") {
    return <IncomingCall onOpenAlbum={() => setStage("album")} />;
  }
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24 }}>
      <p>Album comes in the next step.</p>
    </main>
  );
}