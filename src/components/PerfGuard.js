"use client";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

// Spec: if frame time stays high for ~2 seconds, drop the pixel ratio to 1.
// Put <PerfGuard /> inside every <Canvas>.
export default function PerfGuard() {
  const setDpr = useThree((s) => s.setDpr);
  const st = useRef({ slow: 0, done: false });

  useFrame((_, dt) => {
    const s = st.current;
    if (s.done || dt > 0.5) return; // ignore tab-switch gaps
    if (dt > 0.03) s.slow += dt;
    else s.slow = Math.max(0, s.slow - dt * 2);
    if (s.slow > 2) {
      s.done = true;
      setDpr(1);
    }
  });

  return null;
}