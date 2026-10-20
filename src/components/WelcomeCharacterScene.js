"use client";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import PerfGuard from "./PerfGuard";
import { useWebGL } from "../lib/webgl";

const damp = THREE.MathUtils.damp;
const ORANGE = new THREE.Color("#f2a65a");
const COOL = new THREE.Color("#b9c4d6");
const ANGRY = new THREE.Color("#ff7a5c");
const WHITE = new THREE.Color("#ffffff");
const HOT = new THREE.Color("#ff9a8a");

/* ---------------- AWAAZ (Web Audio, koi file nahi chahiye) ---------------- */
let actx = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!actx) actx = new AC();
  if (actx.state === "suspended") actx.resume();
  return actx;
}

function voice(c, { f0, f1, f2, dur, vol = 0.25, vib = 0, start = 0, formant = 1200 }) {
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const bp = c.createBiquadFilter();
  const g = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.linearRampToValueAtTime(f1, t0 + dur * 0.4);
  osc.frequency.linearRampToValueAtTime(f2, t0 + dur);
  bp.type = "bandpass";
  bp.Q.value = 3;
  bp.frequency.setValueAtTime(formant * 0.6, t0);
  bp.frequency.linearRampToValueAtTime(formant * 1.4, t0 + dur * 0.5);
  bp.frequency.linearRampToValueAtTime(formant * 0.7, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  if (vib) {
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = vib;
    lg.gain.value = f1 * 0.06;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.05);
  }
  osc.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function hiss(c, { dur, vol, start = 0 }) {
  const t0 = c.currentTime + start;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 3500;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(hp);
  hp.connect(g);
  g.connect(c.destination);
  src.start(t0);
}

// returns kitne second tak billi "bolegi"
function playSfx(kind) {
  try {
    const c = getCtx();
    if (!c) return 0;
    if (kind === "happy") {
      voice(c, { f0: 620, f1: 1050, f2: 760, dur: 0.5, vol: 0.22, formant: 1500 });
      voice(c, { f0: 760, f1: 1250, f2: 900, dur: 0.45, vol: 0.22, formant: 1600, start: 0.65 });
      return 1.1;
    }
    if (kind === "sad") {
      voice(c, { f0: 700, f1: 520, f2: 330, dur: 0.9, vol: 0.15, vib: 6, formant: 1100 });
      return 0.9;
    }
    if (kind === "angry") {
      hiss(c, { dur: 0.45, vol: 0.12 });
      voice(c, { f0: 330, f1: 640, f2: 230, dur: 0.95, vol: 0.28, vib: 16, formant: 900, start: 0.1 });
      return 1.1;
    }
    if (kind === "angryBig") {
      hiss(c, { dur: 0.6, vol: 0.18 });
      voice(c, { f0: 280, f1: 700, f2: 200, dur: 1.2, vol: 0.32, vib: 18, formant: 850 });
      voice(c, { f0: 300, f1: 560, f2: 180, dur: 1.0, vol: 0.3, vib: 18, formant: 850, start: 1.0 });
      return 2.1;
    }
  } catch (e) {
    /* audio fail ho toh bhi website chalti rahe */
  }
  return 0;
}

/* ---------------- BILLI ---------------- */
function Character({ mood, noCount, ptr }) {
  const root = useRef();
  const head = useRef();
  const tail = useRef();
  const armL = useRef();
  const armR = useRef();
  const browL = useRef();
  const browR = useRef();
  const eyes = useRef();
  const pupL = useRef();
  const pupR = useRef();
  const mouth = useRef();
  const jaw = useRef();
  const tear = useRef();
  const puffs = useRef([]);
  const reduced = useRef(false);
  const lastKey = useRef("");
  const voiceUntil = useRef(0);
  const s = useRef({
    y: 0, rotY: 0, rotX: 0, aL: 0.25, aR: 0.25, steam: 0, cool: 0,
    bSad: 0, bAng: 0, brow: 0, smile: 1, tear: 0, shake: 0,
    slit: 0, tailAmp: 0.25, tp: 0, squint: 0, open: 0,
  }).current;

  const fur = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f2a65a", roughness: 0.8 }),
    []
  );

  const lvl = mood === "sad" ? (noCount >= 4 ? 3 : noCount >= 2 ? 2 : 1) : 0;

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // mood badle toh awaaz nikalo
  useEffect(() => {
    const kind =
      mood === "happy" ? "happy"
      : lvl === 1 ? "sad"
      : lvl === 2 ? "angry"
      : lvl === 3 ? "angryBig"
      : null;
    if (!kind) {
      lastKey.current = "";
      return;
    }
    const key = `${mood}-${noCount}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    const secs = playSfx(kind);
    voiceUntil.current = performance.now() / 1000 + secs;
  }, [mood, noCount, lvl]);

  useFrame((state, dt0) => {
    const dt = Math.min(dt0, 0.05);
    const t = state.clock.elapsedTime;
    const rm = reduced.current ? 0.25 : 1;
    const talking = performance.now() / 1000 < voiceUntil.current;

    let y = Math.sin(t * 2) * 0.03 * rm;
    let rotY = Math.sin(t * 0.8) * 0.08 * rm;
    let rotX = 0;
    let aL = 0.25 + Math.sin(t * 2) * 0.05 * rm;
    let aR = aL;
    let steam = 0, cool = 0, bSad = 0, bAng = 0, brow = 0, smile = 1, tr = 0, shake = 0;
    let slit = 0, tailAmp = 0.25, tailSpd = 2, squint = 0, tilt = 0;

    if (mood === "dance") {
      y = Math.abs(Math.sin(t * 6)) * 0.28 * rm;
      rotY = Math.sin(t * 4) * 0.5 * rm;
      aL = 1.8 + Math.sin(t * 8) * 0.7 * rm;
      aR = 1.8 + Math.sin(t * 8 + Math.PI) * 0.7 * rm;
      brow = 1; tailAmp = 0.6; tailSpd = 10; tilt = Math.sin(t * 6) * 0.2 * rm;
    } else if (mood === "happy") {
      y = Math.abs(Math.sin(t * 5)) * 0.45 * rm;
      rotY = Math.sin(t * 3) * 0.3 * rm;
      aL = aR = 2.5;
      brow = 1; tailAmp = 0.8; tailSpd = 12; squint = 1;
    } else if (lvl === 1) {
      y = -0.06; rotX = 0.2; aL = aR = 0.05;
      cool = 1; bSad = 1; smile = 0; tr = 1; tailAmp = 0.05; tailSpd = 1;
    } else if (lvl === 2) {
      y = -0.02; aL = aR = 0.9;
      steam = 3; bAng = 1; smile = 0; shake = 1; slit = 1; tailAmp = 0.7; tailSpd = 14;
    } else if (lvl === 3) {
      rotY = 2.7; aL = aR = 0.9;
      steam = 3.5; bAng = 1; smile = 0; shake = 1; slit = 1; tailAmp = 0.9; tailSpd = 18;
    }

    s.y = damp(s.y, y, 14, dt);
    s.rotY = damp(s.rotY, rotY, 5, dt);
    s.rotX = damp(s.rotX, rotX, 8, dt);
    s.aL = damp(s.aL, aL, 12, dt);
    s.aR = damp(s.aR, aR, 12, dt);
    s.steam = damp(s.steam, steam, 4, dt);
    s.cool = damp(s.cool, cool, 4, dt);
    s.bSad = damp(s.bSad, bSad, 8, dt);
    s.bAng = damp(s.bAng, bAng, 8, dt);
    s.brow = damp(s.brow, brow, 8, dt);
    s.smile = damp(s.smile, smile, 10, dt);
    s.tear = damp(s.tear, tr, 6, dt);
    s.shake = damp(s.shake, shake, 8, dt);
    s.slit = damp(s.slit, slit, 10, dt);
    s.tailAmp = damp(s.tailAmp, tailAmp, 6, dt);
    s.squint = damp(s.squint, squint, 8, dt);
    s.open = damp(s.open, talking ? 0.35 + 0.65 * Math.abs(Math.sin(t * 14)) : 0, 18, dt);
    s.tp += dt * tailSpd;

    // squash and stretch
    const stretch = 1 + Math.max(s.y, 0) * 0.35;
    const squash = 1 / Math.sqrt(stretch);
    const g = root.current;
    g.position.set(Math.sin(t * 45) * 0.012 * s.shake, s.y, 0);
    g.rotation.set(0, s.rotY, 0);
    g.scale.set(squash, stretch, squash);

    // sar: jhukna, tilt, bolte waqt hilna
    head.current.rotation.x = s.rotX * 1.5;
    head.current.rotation.z =
      tilt + Math.sin(t * (talking ? 20 : 1.5)) * (talking ? 0.05 : 0.03) * rm;

    // rang: normal -> udaas (neela) -> gussa (laal)
    fur.color.copy(ORANGE).lerp(COOL, s.cool).lerp(ANGRY, s.bAng * 0.35);

    armL.current.rotation.z = -s.aL;
    armR.current.rotation.z = s.aR;

    // poonch
    tail.current.rotation.z = Math.sin(s.tp) * s.tailAmp;
    tail.current.scale.setScalar(1 + s.bAng * 0.25);

    // bhwen
    const bt = s.bSad * 0.38 - s.bAng * 0.42;
    const by = 0.27 + s.brow * 0.04;
    browL.current.rotation.z = bt;
    browR.current.rotation.z = -bt;
    browL.current.position.y = by;
    browR.current.position.y = by;

    // aankhein: blink + khushi mein squint + gusse mein slit pupil
    const blink = t % 3.7 > 3.6 ? 0.1 : 1;
    eyes.current.scale.y = Math.min(blink, 1 - s.squint * 0.3);
    const ox = ptr.current.x * 0.045;
    const oy = ptr.current.y * 0.04 - s.bSad * 0.035;
    pupL.current.position.set(-0.24 + ox, oy, 0.57);
    pupR.current.position.set(0.24 + ox, oy, 0.57);
    pupL.current.scale.set(0.7 - 0.45 * s.slit, 1.2, 0.5);
    pupR.current.scale.set(0.7 - 0.45 * s.slit, 1.2, 0.5);

    // muh
    mouth.current.rotation.z = Math.PI * s.smile;
    mouth.current.position.y = -0.2 + 0.06 * s.smile;
    jaw.current.scale.set(1 + s.open * 0.4, Math.max(s.open * 1.4, 0.001), 0.5);

    // aansu
    const p = (t * 0.9) % 1;
    tear.current.position.set(-0.3, -0.04 - p * 0.2, 0.5);
    tear.current.scale.set(s.tear, s.tear * 1.3, s.tear);
    tear.current.material.opacity = s.tear * (1 - p * 0.6);

    // gusse ki bhaap (kaan ke paas se)
    puffs.current.forEach((m, i) => {
      if (!m) return;
      const sp = 0.35 + s.steam * 0.18;
      const q = (t * sp + i / 5) % 1;
      m.position.set(
        (i % 2 ? 0.55 : -0.55) + Math.sin(q * 7 + i * 2) * 0.1,
        0.75 + q * (0.8 + s.steam * 0.15),
        Math.cos(i) * 0.05
      );
      m.scale.setScalar(0.08 + q * 0.16 * (0.7 + s.steam * 0.2));
      m.material.opacity = Math.sin(q * Math.PI) * 0.35 * Math.min(s.steam, 1.2);
      m.material.color.copy(WHITE).lerp(HOT, s.bAng);
    });
  });

  return (
    <>
      <group ref={root}>
        {/* body */}
        <mesh position={[0, -0.35, 0]} scale={[1, 1, 0.85]} material={fur}>
          <sphereGeometry args={[0.5, 32, 32]} />
        </mesh>
        <mesh position={[0, -0.4, 0.22]} scale={[0.65, 0.72, 0.45]}>
          <sphereGeometry args={[0.5, 24, 24]} />
          <meshStandardMaterial color="#fff1dc" roughness={0.8} />
        </mesh>

        {/* tail */}
        <group ref={tail} position={[0.35, -0.45, -0.4]}>
          <mesh rotation={[0, 0, -Math.PI / 2]} material={fur}>
            <torusGeometry args={[0.28, 0.07, 12, 28, Math.PI]} />
          </mesh>
          <mesh position={[0, 0.28, 0]} material={fur}>
            <sphereGeometry args={[0.075, 12, 12]} />
          </mesh>
        </group>

        {/* arms */}
        {[
          [armL, -1],
          [armR, 1],
        ].map(([r, sx]) => (
          <group key={sx} ref={r} position={[sx * 0.42, -0.1, 0.3]}>
            <mesh position={[0, -0.2, 0]} material={fur}>
              <capsuleGeometry args={[0.08, 0.26, 8, 16]} />
            </mesh>
            <mesh position={[0, -0.4, 0]}>
              <sphereGeometry args={[0.095, 16, 16]} />
              <meshStandardMaterial color="#fff1dc" roughness={0.7} />
            </mesh>
          </group>
        ))}

        {/* feet */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.25, -0.84, 0.15]} scale={[1, 0.6, 1.3]} material={fur}>
            <sphereGeometry args={[0.15, 16, 16]} />
          </mesh>
        ))}

        {/* head */}
        <group ref={head} position={[0, 0.3, 0]}>
          <mesh scale={[1.15, 0.95, 1]} material={fur}>
            <sphereGeometry args={[0.58, 40, 40]} />
          </mesh>

          {/* kaan */}
          {[-1, 1].map((sx) => (
            <group key={sx} position={[sx * 0.4, 0.5, 0]} rotation={[0, 0, -sx * 0.3]}>
              <mesh material={fur}>
                <coneGeometry args={[0.2, 0.4, 16]} />
              </mesh>
              <mesh position={[0, -0.03, 0.06]} scale={[0.6, 0.65, 0.5]}>
                <coneGeometry args={[0.2, 0.4, 16]} />
                <meshStandardMaterial color="#ffb3c1" roughness={0.7} />
              </mesh>
            </group>
          ))}

          {/* maatha stripes */}
          {[-0.1, 0, 0.1].map((x) => (
            <mesh key={x} position={[x, 0.38, 0.43]} rotation={[-0.6, 0, 0]}>
              <boxGeometry args={[0.03, x === 0 ? 0.14 : 0.1, 0.03]} />
              <meshStandardMaterial color="#c9772e" roughness={0.8} />
            </mesh>
          ))}

          {/* birthday topi */}
          <group position={[0, 0.55, 0]} rotation={[0, 0, -0.2]}>
            <mesh position={[0, 0.25, 0]}>
              <coneGeometry args={[0.2, 0.5, 24]} />
              <meshStandardMaterial color="#ff5fa2" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.19, 0.025, 8, 24]} />
              <meshStandardMaterial color="#ffd54a" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial color="#ffd54a" roughness={0.4} />
            </mesh>
          </group>

          {/* aankhein */}
          <group ref={eyes} position={[0, 0.08, 0]}>
            {[-1, 1].map((sx) => (
              <mesh key={sx} position={[sx * 0.24, 0, 0.5]} scale={[1, 1.2, 0.55]}>
                <sphereGeometry args={[0.12, 24, 24]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
            ))}
            {[
              [pupL, -1],
              [pupR, 1],
            ].map(([r, sx]) => (
              <mesh key={sx} ref={r} position={[sx * 0.24, 0, 0.57]} scale={[0.7, 1.2, 0.5]}>
                <sphereGeometry args={[0.075, 16, 16]} />
                <meshStandardMaterial color="#1a1420" roughness={0.2} />
                <mesh position={[0.02, 0.03, 0.06]}>
                  <sphereGeometry args={[0.02, 8, 8]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </mesh>
            ))}
          </group>

          {/* bhwen */}
          <mesh ref={browL} position={[-0.24, 0.27, 0.5]}>
            <boxGeometry args={[0.18, 0.04, 0.04]} />
            <meshStandardMaterial color="#5a3a22" />
          </mesh>
          <mesh ref={browR} position={[0.24, 0.27, 0.5]}>
            <boxGeometry args={[0.18, 0.04, 0.04]} />
            <meshStandardMaterial color="#5a3a22" />
          </mesh>

          {/* naak */}
          <mesh position={[0, -0.06, 0.565]} scale={[1.2, 0.8, 0.8]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color="#ff7a95" roughness={0.4} />
          </mesh>

          {/* muh: khula muh + smile/frown */}
          <mesh ref={jaw} position={[0, -0.2, 0.535]} scale={[1, 0.001, 0.5]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#5a1a1f" />
          </mesh>
          <group ref={mouth} position={[0, -0.14, 0.555]}>
            {[-1, 1].map((sx) => (
              <mesh key={sx} position={[sx * 0.055, 0, 0]}>
                <torusGeometry args={[0.055, 0.014, 8, 16, Math.PI]} />
                <meshStandardMaterial color="#7a2e2e" />
              </mesh>
            ))}
          </group>

          {/* whiskers */}
          {[-1, 1].map((sx) =>
            [-1, 0, 1].map((k) => (
              <mesh
                key={`${sx}${k}`}
                position={[sx * 0.5, -0.08 - k * 0.05, 0.42]}
                rotation={[0, 0, Math.PI / 2 + sx * k * 0.2]}
              >
                <cylinderGeometry args={[0.007, 0.007, 0.45, 6]} />
                <meshStandardMaterial color="#fff6e6" />
              </mesh>
            ))
          )}

          {/* blush */}
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * 0.38, -0.05, 0.46]} scale={[1, 0.6, 0.3]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color="#ff8a8a" transparent opacity={0.7} />
            </mesh>
          ))}

          {/* aansu */}
          <mesh ref={tear} position={[-0.3, -0.04, 0.5]} scale={0}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial color="#8fd3ff" transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>

        {/* gusse ki bhaap */}
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} ref={(el) => { puffs.current[i] = el; }}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}

        {mood === "happy" && (
          <Sparkles count={28} scale={[2.6, 2.4, 1.2]} position={[0, 0.3, 0.3]} size={5} speed={0.8} color="#ff9ec4" />
        )}
      </group>

      {/* gadda: billi ke neeche, jump ke time wahin rehta hai */}
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.06, 48]} />
        <meshStandardMaterial color="#ff9ec4" roughness={0.9} />
      </mesh>
      <ContactShadows position={[0, -0.93, 0]} opacity={0.5} scale={4} blur={2.2} far={1.5} />
    </>
  );
}

export default function WelcomeCharacterScene({ mood = "idle", noCount = 0 }) {
  const gl = useWebGL();
  const ptr = useRef({ x: 0, y: 0 });

  // aankhein cursor ko follow karti hain
  useEffect(() => {
    const onMove = (e) => {
      ptr.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  if (gl === false) {
    const cls = mood === "sad" ? "sad" : mood === "idle" ? "idle" : "happy";
    return (
      <div className={`character ${cls}`} role="img" aria-label="Cartoon cat">
        🐱
      </div>
    );
  }
  if (gl === null) return <div className="character-canvas" />;
  return (
    <div className="character-canvas" role="img" aria-label="3D cartoon cat character">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.3, 5], fov: 38 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}
      >
        <PerfGuard />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 4]} intensity={1.5} color="#ffe2b0" />
        <directionalLight position={[-3, 2, -2]} intensity={1.2} color="#b79cff" />
        <pointLight position={[0, 0.2, 3]} intensity={12} color="#ffb85c" />
        <Character mood={mood} noCount={noCount} ptr={ptr} />
      </Canvas>
    </div>
  );
}
