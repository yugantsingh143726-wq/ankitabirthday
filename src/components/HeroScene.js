"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { site } from "../content/site";
import { playChime } from "../lib/chime";
import { loadPhotoTexture } from "../lib/textures";
import PerfGuard from "./PerfGuard";
import { useWebGL } from "../lib/webgl";
import HeroFallback from "./HeroFallback";

const COUNT = site.hero.photoCount;
const FRONT = 10; // photos 0-9: front ring
const TAIL_END = 15; // photos 10-14: wave tail, 15-24: back ring
const ease = (x) => 1 - Math.pow(1 - x, 3);
const lerp = (a, b, t) => a + (b - a) * t;
const nowSec = () => performance.now() / 1000;
const FRAME_COLOR = new THREE.Color("#f6ecd6");

function makeLayout() {
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: COUNT }, () => ({
    pos: [(rnd() - 0.5) * 11, (rnd() - 0.5) * 6.5, -4 + rnd() * 5],
    rot: [(rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.6],
    phase: rnd() * Math.PI * 2,
  }));
}

// PLACEHOLDER texture: used when a photo file is missing
function makeTexture(i) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 640;
  const g = c.getContext("2d");
  const hue = (i * 47) % 360;
  const grad = g.createLinearGradient(0, 0, 512, 640);
  grad.addColorStop(0, `hsl(${hue},45%,35%)`);
  grad.addColorStop(1, `hsl(${(hue + 60) % 360},55%,55%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 640);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.textAlign = "center";
  g.font = "bold 160px sans-serif";
  g.fillText(String(i + 1).padStart(2, "0"), 256, 350);
  g.font = "28px sans-serif";
  g.fillText("PLACEHOLDER", 256, 410);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Tries /photos/NN.webp, then /photos/NN.jpg, else keeps the placeholder
function PhotoFace({ index }) {
  const [map, setMap] = useState(null);

  useEffect(() => {
    let real = null;
    const placeholder = makeTexture(index);
    setMap(placeholder);
    const cancel = loadPhotoTexture(index, 768, (t) => {
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

function Photos({ ctrl, onSelect }) {
  const layout = useMemo(makeLayout, []);
  const refs = useRef([]);

  useFrame(({ clock, viewport, camera }) => {
    const t = clock.getElapsedTime();
    const k = ctrl.igniteAt === null ? 0 : nowSec() - ctrl.igniteAt;
    const e = ease(Math.min(k / 1.6, 1));
    ctrl.m += (ctrl.scroll - ctrl.m) * 0.08; // ring -> wave morph (0..1)
    const m = ctrl.m;
    const xs = Math.min(1, Math.max(0.55, viewport.aspect / 1.4));

    refs.current.forEach((g, i) => {
      if (!g) return;
      const L = layout[i];
      const sx = L.pos[0] * xs;
      const sy = L.pos[1] + Math.sin(t * 0.6 + L.phase) * 0.12;
      const sz = L.pos[2];
      let tx, ty, tz, ry;

      if (i < FRONT) {
        const a = (i / FRONT) * Math.PI * 2 + t * 0.3;
        const cz = Math.sin(a) * 3.3;
        tx = Math.cos(a) * 3.6 * xs;
        ty = 1.5 - cz * 0.25;
        tz = cz * 0.9 - 0.2;
        ry = -Math.cos(a) * 0.4;
      } else if (i < TAIL_END) {
        const s = (i - FRONT) / (TAIL_END - FRONT - 1);
        tx = (2.2 + s * 4.2) * xs;
        ty = -1.9 + Math.sin(s * 5 + t * 2.2) * 0.5 - s * 0.5;
        tz = 0.5 - s * 2.5;
        ry = -0.3;
      } else {
        const a = ((i - TAIL_END) / (COUNT - TAIL_END)) * Math.PI * 2 - t * 0.2;
        const cz = Math.sin(a) * 4.6;
        tx = Math.cos(a) * 4.6 * xs;
        ty = -cz * 0.35 + 0.2;
        tz = cz * 0.9 - 2.2;
        ry = -Math.cos(a) * 0.4;
      }

      // wave ribbon target
      const s = i / (COUNT - 1);
      const wa = s * Math.PI * 2.2 + t * 0.9;
      const wx = (s - 0.5) * 10 * xs;
      const wy = Math.sin(wa) * 1.1;
      const wz = Math.cos(wa) * 1.0;
      const wry = -Math.cos(wa) * 0.35;
      const wrz = Math.cos(wa) * 0.12;

      const bx = lerp(tx, wx, m);
      const by = lerp(ty, wy, m);
      const bz = lerp(tz, wz, m);
      const bry = lerp(ry, wry, m);

      const px = sx + (bx - sx) * e;
      const py = sy + (by - sy) * e;
      const pz = sz + (bz - sz) * e;
      const rx = L.rot[0] * (1 - e);
      const rz = L.rot[2] * (1 - e) + wrz * m * e;
      const rry = L.rot[1] * (1 - e) + bry * e;
      const baseScale = (1 - 0.5 * e) * (1 + 0.2 * m);

      // selection: bring forward / dim others
      const u = g.userData;
      const isSel = ctrl.sel === i;
      u.s = (u.s ?? 0) + ((isSel ? 1 : 0) - (u.s ?? 0)) * 0.12;
      u.d = (u.d ?? 1) + ((ctrl.sel !== null && !isSel ? 0.25 : 1) - (u.d ?? 1)) * 0.12;
      const selZ = camera.position.z - 3.1;

      g.position.set(lerp(px, 0, u.s), lerp(py, 0, u.s), lerp(pz, selZ, u.s));
      g.rotation.set(rx * (1 - u.s), rry * (1 - u.s), rz * (1 - u.s));
      g.scale.setScalar(lerp(baseScale, 1.1, u.s));
      g.children[0].material.color.copy(FRAME_COLOR).multiplyScalar(u.d);
      g.children[1].material.color.setScalar(u.d);
    });
  });

  return (
    <>
      {layout.map((L, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={L.pos}
          rotation={L.rot}
          onClick={(ev) => {
            ev.stopPropagation();
            if (ctrl.m < 0.6) return;
            const next = ctrl.sel === i ? null : i;
            ctrl.sel = next;
            onSelect(next);
          }}
        >
          <mesh>
            <planeGeometry args={[1.3, 1.75]} />
            <meshBasicMaterial color="#f6ecd6" />
          </mesh>
          <mesh position={[0, 0.12, 0.01]}>
            <planeGeometry args={[1.1, 1.375]} />
            <PhotoFace index={i} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// Gold "23" built from code (no font file): two extruded digit outlines
function makeDigitShape(d) {
  const s = new THREE.Shape();
  if (d === 2) {
    s.moveTo(0, 0.55);
    s.bezierCurveTo(0, 1.35, 0.35, 1.6, 0.8, 1.6);
    s.bezierCurveTo(1.35, 1.6, 1.6, 1.3, 1.6, 0.9);
    s.bezierCurveTo(1.6, 0.5, 1.35, 0.3, 0.9, -0.15);
    s.lineTo(0.55, -0.6);
    s.lineTo(1.7, -0.6);
    s.lineTo(1.7, -1.0);
    s.lineTo(0.0, -1.0);
    s.lineTo(0.0, -0.65);
    s.lineTo(0.55, -0.1);
    s.bezierCurveTo(0.95, 0.3, 1.1, 0.5, 1.1, 0.9);
    s.bezierCurveTo(1.1, 1.15, 1.0, 1.2, 0.8, 1.2);
    s.bezierCurveTo(0.55, 1.2, 0.5, 1.0, 0.5, 0.55);
    s.lineTo(0, 0.55);
    return s;
  }
  // ---- Paste this INSIDE makeDigitShape(d) in HeroScene.js,
// ---- right before the line:   // digit 3
  if (d === 4) {
    s.moveTo(0, -0.1);
    s.lineTo(1.05, -0.1);
    s.lineTo(1.05, -1.1);
    s.lineTo(1.6, -1.1);
    s.lineTo(1.6, -0.1);
    s.lineTo(1.85, -0.1);
    s.lineTo(1.85, 0.32);
    s.lineTo(1.6, 0.32);
    s.lineTo(1.6, 1.6);
    s.lineTo(1.05, 1.6);
    s.lineTo(0, 0.32);
    s.lineTo(0, -0.1);
    // triangular counter (hole) of the 4
    const hole = new THREE.Path();
    hole.moveTo(0.45, 0.32);
    hole.lineTo(1.05, 0.32);
    hole.lineTo(1.05, 1.0);
    hole.lineTo(0.45, 0.32);
    s.holes.push(hole);
    return s;
  }
  // digit 3
  s.moveTo(0.05, 0.6);
  s.bezierCurveTo(0.05, 1.3, 0.4, 1.6, 0.85, 1.6);
  s.bezierCurveTo(1.35, 1.6, 1.65, 1.35, 1.65, 0.95);
  s.bezierCurveTo(1.65, 0.65, 1.5, 0.45, 1.25, 0.35);
  s.bezierCurveTo(1.6, 0.25, 1.8, 0.0, 1.8, -0.4);
  s.bezierCurveTo(1.8, -0.85, 1.4, -1.1, 0.85, -1.1);
  s.bezierCurveTo(0.3, -1.1, 0.0, -0.8, 0.0, -0.2);
  s.lineTo(0.5, -0.2);
  s.bezierCurveTo(0.5, -0.6, 0.65, -0.72, 0.85, -0.72);
  s.bezierCurveTo(1.1, -0.72, 1.28, -0.6, 1.28, -0.4);
  s.bezierCurveTo(1.28, -0.12, 1.1, 0.05, 0.7, 0.05);
  s.lineTo(0.7, 0.4);
  s.bezierCurveTo(1.05, 0.4, 1.15, 0.55, 1.15, 0.85);
  s.bezierCurveTo(1.15, 1.1, 1.05, 1.2, 0.85, 1.2);
  s.bezierCurveTo(0.6, 1.2, 0.55, 1.0, 0.55, 0.6);
  s.lineTo(0.05, 0.6);
  return s;
}

function Gold23({ ctrl }) {
  const ref = useRef();
  const geos = useMemo(() => {
    const opts = {
      depth: 0.6,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 3,
      curveSegments: 16,
    };
    return [2, 4].map((d) => {
      const g = new THREE.ExtrudeGeometry(makeDigitShape(d), opts);
      g.computeVertexNormals();
      return g;
    });
  }, []);
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);

  useFrame(({ clock }) => {
    const k = ctrl.igniteAt === null ? 0 : nowSec() - ctrl.igniteAt;
    const e = ease(Math.min(k / 1.2, 1));
    ref.current.scale.setScalar(Math.max(e * (1 - ctrl.m), 0.0001));
    ref.current.position.y = Math.sin(clock.getElapsedTime() * 1.2) * 0.06;
    ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.15;
  });

  return (
    <group ref={ref} scale={0.0001}>
      <mesh geometry={geos[0]} position={[-1.95, 0, -0.3]}>
        <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.3} emissive="#4a3508" />
      </mesh>
      <mesh geometry={geos[1]} position={[0.15, 0, -0.3]}>
        <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.3} emissive="#4a3508" />
      </mesh>
    </group>
  );
}

function Halo({ ctrl }) {
  const mat = useRef();
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "rgba(255,200,110,0.85)");
    gr.addColorStop(0.4, "rgba(255,160,70,0.28)");
    gr.addColorStop(1, "rgba(255,140,60,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame(({ clock }) => {
    const k = ctrl.igniteAt === null ? 0 : nowSec() - ctrl.igniteAt;
    const e = ease(Math.min(k / 1.6, 1));
    mat.current.opacity = e * (0.8 + Math.sin(clock.getElapsedTime() * 1.5) * 0.1);
  });
  return (
    <mesh position={[0, 0, -1.5]}>
      <planeGeometry args={[11, 11]} />
      <meshBasicMaterial
        ref={mat}
        map={tex}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function Shockwave({ ctrl }) {
  const mesh = useRef();
  useFrame(() => {
    const k = ctrl.igniteAt === null ? 99 : nowSec() - ctrl.igniteAt;
    const p = Math.min(k / 1.2, 1);
    const visible = ctrl.igniteAt !== null && p < 1;
    mesh.current.visible = visible;
    if (visible) {
      mesh.current.scale.setScalar(0.5 + ease(p) * 12);
      mesh.current.material.opacity = (1 - p) * 0.9;
    }
  });
  return (
    <mesh ref={mesh} visible={false}>
      <ringGeometry args={[0.92, 1, 64]} />
      <meshBasicMaterial color="#ffd98a" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CameraRig({ ctrl }) {
  useFrame(({ camera, viewport }) => {
    const k = ctrl.igniteAt === null ? -1 : nowSec() - ctrl.igniteAt;
    const aspect = viewport.aspect;
    const baseZ = aspect >= 1.2 ? 6 : 6 + (1.2 - aspect) * 9;
    const kick = k >= 0 && !ctrl.reduced ? 0.9 * Math.exp(-k * 5) * Math.cos(k * 14) : 0;
    const par = k >= 0 && !ctrl.reduced ? Math.min(k / 1.5, 1) : 0;
    camera.position.x += (ctrl.nx * 0.7 * par - camera.position.x) * 0.06;
    camera.position.y += (ctrl.ny * 0.4 * par - camera.position.y) * 0.06;
    camera.position.z = baseZ - kick;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Countdown({ delay }) {
  const { month, day } = site.hero.birthday;
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;
  const isToday = now.getMonth() === month - 1 && now.getDate() === day;

  if (isToday) {
    return (
      <div className="countdown" style={{ animationDelay: delay + "s" }}>
        <p className="cd-today">{site.hero.countdownToday}</p>
      </div>
    );
  }

  let target = new Date(now.getFullYear(), month - 1, day);
  if (target <= now) target = new Date(now.getFullYear() + 1, month - 1, day);
  let s = Math.floor((target - now) / 1000);
  const d = Math.floor(s / 86400);
  s %= 86400;
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  s %= 60;
  const boxes = [
    [d, "DAYS"],
    [h, "HRS"],
    [m, "MIN"],
    [s, "SEC"],
  ];

  return (
    <div className="countdown" style={{ animationDelay: delay + "s" }}>
      {boxes.map(([n, label]) => (
        <div className="cd-box" key={label}>
          <div className="cd-num">{String(n).padStart(2, "0")}</div>
          <div className="cd-label">{label}</div>
        </div>
      ))}
      <p className="cd-caption">{site.hero.countdownLabel}</p>
    </div>
  );
}

export default function HeroScene({ onPickUp }) {
  const maskRef = useRef(null);
  const btnRef = useRef(null);
  const heroRef = useRef(null);
  const ctrl = useRef({
    nx: 0,
    ny: 0,
    igniteAt: null,
    reduced: false,
    scroll: 0,
    m: 0,
    sel: null,
  }).current;
  const hold = useRef({ down: false, p: 0, done: false }).current;
  const [ignited, setIgnited] = useState(false);
  const [sel, setSel] = useState(null);
  const [showCall, setShowCall] = useState(false);
  const [inWave, setInWave] = useState(false);
    const gl = useWebGL();
  const pick = (i) => {
    const next = i === null || ctrl.sel === i ? null : i;
    ctrl.sel = next;
    setSel(next);
  };
  const autoCallTimer = useRef(null);
  const callStarted = useRef(false);

  const startCall = useCallback(() => {
    if (callStarted.current) return;
    callStarted.current = true;
    if (autoCallTimer.current !== null) {
      window.clearTimeout(autoCallTimer.current);
      autoCallTimer.current = null;
    }
    onPickUp?.();
  }, [onPickUp]);

  // Torch mask + pointer tracking (scroll stays locked until ignition)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const el = maskRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ctrl.reduced = reduced;
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let px = null;
    let py = null;
    let last = -Infinity;
    let raf;

    function onMove(e) {
      px = e.clientX;
      py = e.clientY;
      last = performance.now();
      ctrl.nx = (e.clientX / window.innerWidth - 0.5) * 2;
      ctrl.ny = -(e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);

    function tick(now) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let tx = w / 2;
      let ty = h / 2;
      if (now - last < 2000 && px !== null) {
        tx = px;
        ty = py;
      } else if (!reduced) {
        const t = (now / 1000) * 0.6;
        const d = 1 + Math.sin(t) ** 2;
        tx = w / 2 + (w * 0.3 * Math.cos(t)) / d;
        ty = h / 2 + (h * 0.5 * Math.sin(t) * Math.cos(t)) / d;
      }
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.setProperty("--tx", cx + "px");
      el.style.setProperty("--ty", cy + "px");
      el.style.setProperty("--r", Math.min(w, h) * 0.3 + "px");
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.body.style.overflow = "";
    };
  }, [ctrl]);

  // Hold-to-ignite: 1.8s fill, 0.8s drain; Space/Enter also work
  useEffect(() => {
    let raf;
    let last = performance.now();

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      hold.p = hold.down ? Math.min(1, hold.p + dt / 1.8) : Math.max(0, hold.p - dt / 0.8);
      if (btnRef.current) btnRef.current.style.setProperty("--p", hold.p);
      if (hold.p >= 1) {
        hold.done = true;
        ctrl.igniteAt = nowSec();
        playChime();
        document.body.style.overflow = "";
        setIgnited(true);
        return;
      }
      raf = requestAnimationFrame(loop);
    }
    if (!hold.done) raf = requestAnimationFrame(loop);

    function onKeyDown(e) {
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        hold.down = true;
      }
    }
    function onKeyUp(e) {
      if (e.code === "Space" || e.key === "Enter") hold.down = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [ctrl, hold]);

  // After ignition: page scroll drives the ring -> wave morph
  useEffect(() => {
    if (!ignited) return;
    window.scrollTo(0, 0);
    function onScroll() {
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.5)));
      ctrl.scroll = p;
      heroRef.current?.style.setProperty("--g", p);
      setInWave(p > 0.6);
      setShowCall(p >= 0.97);
            if (p >= 0.97 && autoCallTimer.current === null && !callStarted.current) {
        autoCallTimer.current = window.setTimeout(() => {
          autoCallTimer.current = null;
          if (ctrl.sel === null) startCall();
        }, 3500);
      } else if (p < 0.97 && autoCallTimer.current !== null) {
        window.clearTimeout(autoCallTimer.current);
        autoCallTimer.current = null;
      }
      if (p < 0.6 && ctrl.sel !== null) {
        ctrl.sel = null;
        setSel(null);
      }
    }
       function onKey(e) {
      if (e.key === "Escape" && ctrl.sel !== null) {
        ctrl.sel = null;
        setSel(null);
      }
      if (ctrl.scroll > 0.6 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        const step = e.key === "ArrowRight" ? 1 : COUNT - 1;
        const n = ctrl.sel === null ? 0 : (ctrl.sel + step) % COUNT;
        ctrl.sel = n;
        setSel(n);
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey);
      if (autoCallTimer.current !== null) {
        window.clearTimeout(autoCallTimer.current);
        autoCallTimer.current = null;
      }
    };
  }, [ignited, ctrl, startCall]);

  const lines = site.hero.lines;
  const lineDelay = (i) => 1.2 + i * 0.9;

  return (
    <>
      <div ref={heroRef} className={`hero ${ignited ? "ignited" : ""}`}>
        <div className="hero-stage">
          {gl && (
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 6], fov: 50 }}
            onPointerMissed={() => {
              if (ctrl.sel !== null) {
                ctrl.sel = null;
                setSel(null);
              }
            }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 3, 5]} intensity={1.6} color="#ffe2b0" />
            <pointLight position={[0, 0, 4]} intensity={30} color="#ffb85c" />
            <PerfGuard />
            <CameraRig ctrl={ctrl} />
            <Halo ctrl={ctrl} />
            <Photos ctrl={ctrl} onSelect={setSel} />
            <Gold23 ctrl={ctrl} />
            <Shockwave ctrl={ctrl} />
          </Canvas>
          )}
         {gl === false && <HeroFallback sel={sel} ignited={ignited} onSelect={pick} />}
          <div className="hero-title">
            <h1>{site.hero.title}</h1>
            <p>{site.hero.subtitle}</p>
          </div>
          <div className="hero-vignette" />
        </div>
        <div className="hero-mask" ref={maskRef} />

        {!ignited && (
          <>
            <button
              ref={btnRef}
              className="hold-btn"
              aria-label={site.hero.holdHint}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture?.(e.pointerId);
                hold.down = true;
              }}
              onPointerUp={() => (hold.down = false)}
              onPointerCancel={() => (hold.down = false)}
              onPointerLeave={() => (hold.down = false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              <span>{site.hero.holdLabel}</span>
            </button>
            <p className="hero-hint">{site.hero.holdHint}</p>
          </>
        )}

        {ignited && (
          <>
            <div className="hero-flash" />
            <div className="hero-overlay">
              <div className="hero-lines">
                {lines.map((line, i) => (
                  <p key={i} style={{ animationDelay: lineDelay(i) + "s" }}>
                    {line}
                  </p>
                ))}
                <Countdown delay={lineDelay(lines.length)} />
              </div>
              <div className="scroll-cue" style={{ animationDelay: lineDelay(lines.length + 1) + "s" }}>
                <span>{site.hero.scrollCue}</span>
                <span className="arrow" aria-hidden="true">
                  ↓
                </span>
              </div>
            </div>

            {inWave && !showCall && (
              <p className="gallery-hint">{sel === null ? site.gallery.hint : site.gallery.backHint}</p>
            )}
            {sel !== null && (
              <div className="gallery-caption" aria-live="polite">
                {site.gallery.captions[sel]}
              </div>
            )}
            {showCall && sel === null && (
              <div className="call-teaser">
                <p>{site.gallery.transitionLine}</p>
                <button className="pickup-btn" onClick={startCall}>
                  {site.gallery.pickUp}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {ignited && <div className="hero-spacer" aria-hidden="true" />}
    </>
  );
}