"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { site } from "../content/site";
import Footer from "./Footer";
import { playBlow } from "../lib/sound";
import { loadPhotoTexture } from "../lib/textures";
import PerfGuard from "./PerfGuard";
import { useWebGL } from "../lib/webgl";
import CakeFallback from "./CakeFallback";

const C = site.candles;
const L = site.letter;
const CANDLES = C.count; // 24
const ORBIT_PHOTOS = 12; // cake photo orbit: reuses /photos/01..12
const CONFETTI = 180;
const CAKE_TOP = 1.6; // y of the top of the cake
const D = 3.2; // distance of the 3D letter in front of the camera
const TYPE_DELAY_MS = 3300; // letter starts typing after the envelope animation
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (x) => 1 - Math.pow(1 - x, 3);
const nowSec = () => performance.now() / 1000;
const HAND = '"Segoe Script","Bradley Hand","Comic Sans MS","Chalkboard SE",cursive';

// PLACEHOLDER texture: used when a photo file is missing
function makeTexture(i) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const g = c.getContext("2d");
  const hue = (i * 47 + 30) % 360;
  const grad = g.createLinearGradient(0, 0, 256, 320);
  grad.addColorStop(0, `hsl(${hue},45%,35%)`);
  grad.addColorStop(1, `hsl(${(hue + 60) % 360},55%,55%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 320);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.textAlign = "center";
  g.font = "bold 80px sans-serif";
  g.fillText(String(i + 1).padStart(2, "0"), 128, 175);
  g.font = "16px sans-serif";
  g.fillText("PLACEHOLDER", 128, 205);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function OrbitPhotoFace({ index }) {
  const [map, setMap] = useState(null);
  useEffect(() => {
    let real = null;
    const placeholder = makeTexture(index);
    setMap(placeholder);
    const cancel = loadPhotoTexture(index, 512, (t) => {
      real = t;
      setMap(t);
      placeholder.dispose();
    });
    return () => {
      cancel();
      placeholder.dispose();
      if (real) real.dispose();
    };
  }, [index]);
  return <meshBasicMaterial key={map ? map.uuid : "none"} map={map} />;
}
// Circular 3D ring of photos orbiting around the cake
function PhotoOrbit({ ctrl, radius }) {
  const ring = useRef(null);
  useFrame(({ clock }) => {
    ring.current.rotation.y = clock.getElapsedTime() * (ctrl.reduced ? 0.06 : 0.28);
  });
  return (
    <group position={[0, 1.0, 0]} rotation={[0.18, 0, 0]}>
      <group ref={ring}>
        {Array.from({ length: ORBIT_PHOTOS }, (_, i) => {
          const a = (i / ORBIT_PHOTOS) * Math.PI * 2;
          return (
            <group
              key={i}
              position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}
              rotation={[0, Math.PI / 2 - a, 0]}
              scale={0.55}
            >
              <mesh>
                <planeGeometry args={[1.3, 1.75]} />
                <meshBasicMaterial color="#f6ecd6" side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, 0.12, 0.01]}>
                <planeGeometry args={[1.1, 1.375]} />
                <OrbitPhotoFace index={i} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function Cake() {
  return (
    <group>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[2.0, 2.0, 0.1, 48]} />
        <meshStandardMaterial color="#d4af37" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.9, 48]} />
        <meshStandardMaterial color="#f3d9c4" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <torusGeometry args={[1.5, 0.06, 12, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.7, 48]} />
        <meshStandardMaterial color="#c97b84" roughness={0.8} />
      </mesh>
      <mesh position={[0, CAKE_TOP, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.05, 12, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Candles: outer + inner ring on top of the cake (count from site.js)
function Candles({ ctrl }) {
  const flames = useRef([]);
  const light = useRef(null);

  const spots = useMemo(() => {
    const outer = Math.ceil(CANDLES * 0.65);
    const inner = CANDLES - outer;
    const arr = [];
    for (let i = 0; i < outer; i++) {
      const a = (i / outer) * Math.PI * 2;
      arr.push([Math.cos(a) * 0.82, Math.sin(a) * 0.82]);
    }
    for (let i = 0; i < inner; i++) {
      const a = (i / inner) * Math.PI * 2 + 0.25;
      arr.push([Math.cos(a) * 0.4, Math.sin(a) * 0.4]);
    }
    return arr;
  }, []);

  const COLORS = ["#f6ecd6", "#ff8a8a", "#d4af37", "#9b8fc4"];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    let sum = 0;
    flames.current.forEach((f, i) => {
      if (!f) return;
      let on = 1;
      if (ctrl.blownAt !== null) {
        on = 1 - clamp((nowSec() - ctrl.blownAt - i * 0.04) / 0.35, 0, 1);
      }
      sum += on;
      const flick = 1 + Math.sin(t * 11 + i * 1.7) * 0.12;
      f.scale.set(on, on * 1.7 * flick, on);
      f.visible = on > 0.01;
    });
    if (light.current) light.current.intensity = 7 * (sum / spots.length);
  });

  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, CAKE_TOP, z]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 10]} />
            <meshStandardMaterial color={COLORS[i % COLORS.length]} />
          </mesh>
          <mesh
            ref={(el) => {
              flames.current[i] = el;
            }}
            position={[0, 0.5, 0]}
          >
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshBasicMaterial color="#ffb347" />
          </mesh>
        </group>
      ))}
      <pointLight ref={light} position={[0, CAKE_TOP + 0.9, 0]} color="#ffb85c" intensity={7} distance={7} />
    </group>
  );
}

// Cake + candles + photo orbit sink back when the letter arrives
function World({ ctrl, children }) {
  const ref = useRef(null);
  useFrame(() => {
    const k = ctrl.letterAt === null ? 0 : nowSec() - ctrl.letterAt;
    const r = ease(clamp((k - 0.3) / 1.2, 0, 1));
    ref.current.position.set(0, -0.9 * r, -2.2 * r);
    ref.current.scale.setScalar(lerp(1, 0.8, r));
  });
  return <group ref={ref}>{children}</group>;
}

// Plain small rectangles only
function Confetti({ ctrl }) {
  const mesh = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: CONFETTI }, () => ({
        x: (Math.random() - 0.5) * 8,
        y: 4.5 + Math.random() * 3,
        z: (Math.random() - 0.5) * 4,
        speed: 1.1 + Math.random() * 1.3,
        sway: 0.8 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        rx: 2 + Math.random() * 4,
        ry: 2 + Math.random() * 4,
      })),
    []
  );

  useEffect(() => {
    const cols = ["#d4af37", "#f6ecd6", "#ff8a8a", "#6b5a8e", "#7fc8a9", "#f2c9a0"].map((c) => new THREE.Color(c));
    for (let i = 0; i < CONFETTI; i++) mesh.current.setColorAt(i, cols[i % cols.length]);
    mesh.current.instanceColor.needsUpdate = true;
  }, []);

  useFrame(() => {
    const m = mesh.current;
    if (ctrl.blownAt === null) {
      m.visible = false;
      return;
    }
    const k = nowSec() - ctrl.blownAt - 0.3;
    if (k < 0) {
      m.visible = false;
      return;
    }
    m.visible = true;
    for (let i = 0; i < CONFETTI; i++) {
      const d = data[i];
      const y = d.y - d.speed * k;
      if (y < -3.5) {
        dummy.scale.setScalar(0);
      } else {
        dummy.scale.setScalar(1);
        dummy.position.set(d.x + Math.sin(k * d.sway + d.phase) * 0.4, y, d.z);
        dummy.rotation.set(k * d.rx, k * d.ry, 0);
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, CONFETTI]} frustumCulled={false} visible={false}>
      <boxGeometry args={[0.07, 0.14, 0.012]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}

// ---------- 3D letter: envelope rises, flap opens, paper slides out, text types ----------
const PW = 1.44; // paper width (world units at distance D)
const PH = 2.0; // paper height

function paintLetter(c, typed, done) {
  const w = 768;
  const h = 1066;
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#fbf3e1");
  g.addColorStop(1, "#f0e3c5");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(160,125,40,0.55)";
  c.lineWidth = 4;
  c.strokeRect(28, 28, w - 56, h - 56);
  c.lineWidth = 1.5;
  c.strokeRect(40, 40, w - 80, h - 80);

  c.textAlign = "center";
  c.fillStyle = "#8a6a14";
  c.font = `bold 50px ${HAND}`;
  c.fillText(L.title, w / 2, 130, w - 140);

  c.textAlign = "left";
  c.fillStyle = "#3b2f2a";
  c.font = `38px ${HAND}`;
  const text = L.text.slice(0, typed) + (!done && typed > 0 ? "|" : "");
  const maxW = w - 140;
  const lh = 58;
  let line = "";
  let y = 230;
  text.split(" ").forEach((word) => {
    const test = line ? line + " " + word : word;
    if (c.measureText(test).width > maxW && line) {
      c.fillText(line, 70, y);
      line = word;
      y += lh;
    } else {
      line = test;
    }
  });
  c.fillText(line, 70, y);

  if (done) {
    c.textAlign = "right";
    c.fillStyle = "#8a6a14";
    c.font = `italic 40px ${HAND}`;
    c.fillText(L.signoff, w - 80, Math.max(y + 110, 700));
  }
}

function Letter3D({ ctrl, typed, done }) {
  const rig = useRef(null);
  const env = useRef(null);
  const flap = useRef(null);
  const paper = useRef(null);

  const sheet = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 1066;
    const ctx = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { ctx, tex };
  }, []);
  const flapGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.75, 0);
    s.lineTo(0.75, 0);
    s.lineTo(0, -0.55);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);

  useEffect(
    () => () => {
      sheet.tex.dispose();
      flapGeo.dispose();
    },
    [sheet, flapGeo]
  );

  useEffect(() => {
    paintLetter(sheet.ctx, typed, done);
    sheet.tex.needsUpdate = true;
  }, [sheet, typed, done]);

  useFrame(({ camera, size }) => {
    const g = rig.current;
    if (ctrl.letterAt === null) {
      g.visible = false;
      return;
    }
    g.visible = true;
    // keep the letter glued in front of the camera
    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);

    const k = nowSec() - ctrl.letterAt;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visH = 2 * D * t;
    const visW = visH * (size.width / size.height);
    const s = Math.min(1, (visH * 0.74) / PH, (visW * 0.94) / PW); // final paper scale
    const es = Math.min(1, (visW * 0.8) / 1.5); // envelope scale
    const y0 = -visH * 0.05;
    const finalY = visH * 0.08;

    // envelope rises, then drops away
    const e0 = ease(clamp(k / 0.8, 0, 1));
    const e3 = ease(clamp((k - 2.4) / 0.8, 0, 1));
    env.current.visible = k < 3.3;
    env.current.scale.setScalar(es);
    env.current.position.set(0, lerp(-visH * 0.8, y0, e0) - visH * 0.9 * e3, 0);

    // flap opens
    flap.current.rotation.x = ease(clamp((k - 0.9) / 0.7, 0, 1)) * Math.PI * 0.92;

    // paper rises out, then comes forward and grows to reading size
    const e2 = ease(clamp((k - 1.6) / 0.8, 0, 1));
    const e4 = ease(clamp((k - 2.3) / 1.0, 0, 1));
    const py = lerp(y0 + 0.5 * e2 * es, finalY, e4);
    const pz = lerp(-0.02, 0.4, e4);
    const ps = lerp(0.5 * es, s, e4);
    paper.current.position.set(0, py, pz);
    paper.current.scale.setScalar(ps);
  });

  return (
    <group ref={rig} visible={false}>
      <group position={[0, 0, -D]}>
        <group ref={env}>
          <mesh>
            <boxGeometry args={[1.5, 1.0, 0.04]} />
            <meshStandardMaterial color="#e8d7b5" roughness={0.8} />
          </mesh>
          <group ref={flap} position={[0, 0.5, 0.025]}>
            <mesh geometry={flapGeo}>
              <meshStandardMaterial color="#d9c39a" roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.4, 0.006]}>
              <circleGeometry args={[0.09, 24]} />
              <meshStandardMaterial color="#d4af37" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        </group>
        <group ref={paper} position={[0, 0, -0.02]} scale={0.0001}>
          <mesh>
            <planeGeometry args={[PW, PH]} />
            <meshBasicMaterial map={sheet.tex} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Rig({ radius }) {
  useFrame(({ camera, size }) => {
    const aspect = size.width / size.height;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const zW = (radius + 0.8) / (t * aspect);
    const zH = 3.6 / t;
    camera.position.set(0, 3.0, Math.max(zW, zH));
    camera.lookAt(0, 0.9, 0);
  });
  return null;
}

function Scene({ ctrl, typed, done }) {
  const [radius, setRadius] = useState(3.3);
  useEffect(() => {
    const upd = () => {
      const aspect = window.innerWidth / window.innerHeight;
      setRadius(3.3 * clamp(aspect / 1.4, 0.62, 1));
    };
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} color="#ffe2b0" />
      <PerfGuard />
      <Rig radius={radius} />
      <World ctrl={ctrl}>
        <Cake />
        <Candles ctrl={ctrl} />
        <PhotoOrbit ctrl={ctrl} radius={radius} />
      </World>
      <Confetti ctrl={ctrl} />
      <Letter3D ctrl={ctrl} typed={typed} done={done} />
    </>
  );
}

export default function CandlesLetter({ onReplay }) {
  const ctrl = useRef({ blownAt: null, letterAt: null, reduced: false }).current;
  const [phase, setPhase] = useState("wish"); // wish | blown | letter
  const [micState, setMicState] = useState("idle"); // idle | asking | listening | denied
  const [typed, setTyped] = useState(0);
  const micRef = useRef({ stream: null, ctx: null, raf: 0 });
  const phaseRef = useRef("wish");

  const stopMic = useCallback(() => {
    const m = micRef.current;
    cancelAnimationFrame(m.raf);
    if (m.stream) m.stream.getTracks().forEach((t) => t.stop());
    if (m.ctx) {
      try {
        m.ctx.close();
      } catch (e) {
        // ignore
      }
    }
    m.stream = null;
    m.ctx = null;
  }, []);

  const blow = useCallback(() => {
    if (phaseRef.current !== "wish") return;
    phaseRef.current = "blown";
    ctrl.blownAt = nowSec();
    playBlow();
    stopMic();
    setMicState("idle");
    setPhase("blown");
    setTimeout(() => {
      phaseRef.current = "letter";
      // reduced motion: skip the envelope animation (it starts already finished)
      ctrl.letterAt = ctrl.reduced ? nowSec() - 10 : nowSec();
      setPhase("letter");
    }, 1500);
  }, [ctrl, stopMic]);

  // Optional mic path: only after the user clicks, stays on-device, never recorded
  const startMic = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicState("denied");
      return;
    }
    setMicState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (phaseRef.current !== "wish") {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      micRef.current.stream = stream;
      micRef.current.ctx = ctx;
      setMicState("listening");
      let loud = 0;
      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        loud = rms > 0.1 ? loud + 1 : Math.max(0, loud - 1);
        if (loud > 12) {
          blow();
          return;
        }
        micRef.current.raf = requestAnimationFrame(loop);
      };
      micRef.current.raf = requestAnimationFrame(loop);
    } catch (e) {
      setMicState("denied");
    }
  }, [blow]);

  useEffect(() => {
    ctrl.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo(0, 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      stopMic(); // always release the microphone
    };
  }, [ctrl, stopMic]);

  // The letter types out on the 3D paper once it has slid out of the envelope
  useEffect(() => {
    if (phase !== "letter") return;
    if (ctrl.reduced) {
      setTyped(L.text.length);
      return;
    }
    let id;
    const start = setTimeout(() => {
      let n = 0;
      id = setInterval(() => {
        n += 1;
        setTyped(n);
        if (n >= L.text.length) clearInterval(id);
      }, 32);
    }, TYPE_DELAY_MS);
    return () => {
      clearTimeout(start);
      if (id) clearInterval(id);
    };
  }, [phase, ctrl]);

  const done = typed >= L.text.length;
  const gl = useWebGL();

  return (
    <div className="cake">
        {gl && (
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 3, 8], fov: 40 }}>
        <Scene ctrl={ctrl} typed={typed} done={done} />
      </Canvas>
      )}

            {gl === false && <CakeFallback phase={phase} typed={typed} done={done} />}

      {phase !== "letter" && (
        <div className="cake-head">
          <h1>{C.heading}</h1>
          <p>{C.sub}</p>
        </div>
      )}

      {phase === "wish" && (
        <div className="cake-ui">
          <button className="btn-gold" onClick={blow} autoFocus>
            {C.blow}
          </button>
          <button
            className="cake-mic"
            onClick={
              micState === "listening"
                ? () => {
                    stopMic();
                    setMicState("idle");
                  }
                : startMic
            }
            disabled={micState === "asking"}
          >
            {C.mic}
          </button>
          <p className="cake-status" aria-live="polite">
            {micState === "listening" ? C.micListening : micState === "denied" ? C.micDenied : ""}
          </p>
        </div>
      )}

      {phase === "letter" && (
        <div className="letter">
          {/* the visible letter is on the 3D paper; this copy is for screen readers */}
          <div className="sr-only">
            <h2>{L.title}</h2>
            <p>{L.text}</p>
            <p>{L.signoff}</p>
          </div>
          {done && <Footer onReplay={onReplay} />}
        </div>
      )}
    </div>
  );
}