"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { site } from "../content/site";
import { playFlip } from "../lib/sound";
import PerfGuard from "./PerfGuard";
import { useWebGL } from "../lib/webgl";
import AlbumFallback from "./AlbumFallback";

const A = site.album;
const N = A.pages.length; // 6 photo pages
const W = 2.4; // page width
const H = 3.2; // page height
const BASE = -0.2; // z of the back cover
const STEP = 0.035; // thickness of one leaf in the stack
const HAND = '"Segoe Script","Bradley Hand","Comic Sans MS","Chalkboard SE",cursive';
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// z of leaf i when it lies on the right (unflipped) or on the left (flipped)
const zRight = (i) => BASE + 0.06 + (N - 1 - i) * STEP;
const zLeft = (i) => BASE + 0.06 + i * STEP;
const zCoverClosed = BASE + 0.06 + N * STEP + 0.03;

// ---------- canvas page painters ----------
const CW = 768;
const CH = 1024;

function paper(c) {
  const g = c.createLinearGradient(0, 0, CW, CH);
  g.addColorStop(0, "#f8efdc");
  g.addColorStop(1, "#efe2c3");
  c.fillStyle = g;
  c.fillRect(0, 0, CW, CH);
}

function wrap(c, text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  words.forEach((w) => {
    const test = line ? line + " " + w : w;
    if (c.measureText(test).width > maxW && line) {
      c.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else {
      line = test;
    }
  });
  c.fillText(line, x, yy);
}

function paintCover(c) {
  const g = c.createLinearGradient(0, 0, CW, CH);
  g.addColorStop(0, "#e6c55a");
  g.addColorStop(0.5, "#c9a227");
  g.addColorStop(1, "#9c7a14");
  c.fillStyle = g;
  c.fillRect(0, 0, CW, CH);
  c.strokeStyle = "rgba(74,53,8,0.55)";
  c.lineWidth = 6;
  c.strokeRect(40, 40, CW - 80, CH - 80);
  c.lineWidth = 2;
  c.strokeRect(58, 58, CW - 116, CH - 116);
  c.fillStyle = "#4a3508";
  c.textAlign = "center";
  c.font = "bold 96px Georgia, serif";
  c.fillText(A.coverTitle, CW / 2, 470, CW - 160);
  c.font = `46px ${HAND}`;
  c.fillText(A.coverSub, CW / 2, 552, CW - 160);
}

function paintBack(c) {
  paper(c);
  c.strokeStyle = "rgba(120,100,70,0.16)";
  c.lineWidth = 2;
  for (let y = 140; y < 920; y += 64) {
    c.beginPath();
    c.moveTo(80, y);
    c.lineTo(CW - 80, y);
    c.stroke();
  }
}

function paintThanks(c) {
  paper(c);
  c.fillStyle = "#3b2f2a";
  c.textAlign = "center";
  c.font = `bold 76px ${HAND}`;
  wrap(c, A.thanks, CW / 2, 430, CW - 160, 100);
}

// photo = loaded Image or null (then a clearly labelled placeholder is drawn)
function paintPage(c, i, photo) {
  paper(c);
  const px = 64;
  const py = 72;
  const pw = CW - 128;
  const ph = 700;
  c.fillStyle = "#fffaf0";
  c.fillRect(px - 14, py - 14, pw + 28, ph + 28);
  if (photo) {
    const s = Math.max(pw / photo.width, ph / photo.height);
    const sw = pw / s;
    const sh = ph / s;
    c.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, px, py, pw, ph);
  } else {
    const hue = (i * 61 + 20) % 360;
    const g = c.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, `hsl(${hue},45%,35%)`);
    g.addColorStop(1, `hsl(${(hue + 60) % 360},55%,55%)`);
    c.fillStyle = g;
    c.fillRect(px, py, pw, ph);
    c.fillStyle = "rgba(255,255,255,0.85)";
    c.textAlign = "center";
    c.font = "bold 200px sans-serif";
    c.fillText(String(i + 1).padStart(2, "0"), CW / 2, py + ph / 2 + 50);
    c.font = "32px sans-serif";
    c.fillText("PLACEHOLDER", CW / 2, py + ph / 2 + 110);
  }
  c.fillStyle = "#3b2f2a";
  c.textAlign = "center";
  c.font = `58px ${HAND}`;
  c.fillText(A.pages[i].caption, CW / 2, 902, CW - 140);
  c.font = "24px sans-serif";
  c.fillStyle = "#8a7a66";
  c.fillText(String(i + 1), CW / 2, 976);
}

function makeSheet(paint) {
  const canvas = document.createElement("canvas");
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  paint(ctx);
  tex.needsUpdate = true;
  return {
    tex,
    repaint(fn) {
      fn(ctx);
      tex.needsUpdate = true;
    },
  };
}

// ---------- 3D book ----------
function Book({ ctrl, onCover, onLeaf }) {
  const root = useRef(null);
  const cover = useRef(null);
  const leaves = useRef([]);

  const sheets = useMemo(
    () => ({
      cover: makeSheet(paintCover),
      inner: makeSheet(paper),
      back: makeSheet(paintBack),
      thanks: makeSheet(paintThanks),
      fronts: A.pages.map((_, i) => makeSheet((c) => paintPage(c, i, null))),
    }),
    []
  );

  // Load /album/01..06 (.webp first, then .jpg); keep the placeholder if missing
  useEffect(() => {
    let dead = false;
    A.pages.forEach((_, i) => {
      const file = String(i + 1).padStart(2, "0");
      const tryLoad = (ext, onFail) => {
        const img = new Image();
        img.onload = () => {
          if (!dead) sheets.fronts[i].repaint((c) => paintPage(c, i, img));
        };
        img.onerror = onFail;
        img.src = `/album/${file}.${ext}`;
      };
      tryLoad("webp", () => tryLoad("jpg", () => {}));
    });
    return () => {
      dead = true;
    };
  }, [sheets]);

  useEffect(
    () => () => {
      sheets.cover.tex.dispose();
      sheets.inner.tex.dispose();
      sheets.back.tex.dispose();
      sheets.thanks.tex.dispose();
      sheets.fronts.forEach((s) => s.tex.dispose());
    },
    [sheets]
  );

  useFrame(({ clock }) => {
    const speed = ctrl.reduced ? 1 : 0.085;
    const s = ctrl.step;
    const t = clock.getElapsedTime();

    ctrl.cv += ((s >= 1 ? 1 : 0) - ctrl.cv) * speed;
    const cp = ctrl.cv;
    root.current.position.x = lerp(-W / 2, 0, ease(cp));
    root.current.rotation.x = -0.28;
    root.current.rotation.y = ctrl.reduced ? 0 : Math.sin(t * 0.5) * 0.05 + ctrl.nx * 0.12;

    cover.current.rotation.y = -Math.PI * cp;
    cover.current.position.z = lerp(zCoverClosed, BASE, cp) + Math.sin(cp * Math.PI) * 0.25;

    leaves.current.forEach((g, i) => {
      if (!g) return;
      ctrl.leaf[i] += ((s >= i + 2 ? 1 : 0) - ctrl.leaf[i]) * speed;
      const p = ctrl.leaf[i];
      g.rotation.y = -Math.PI * p;
      g.position.z = lerp(zRight(i), zLeft(i), p) + Math.sin(p * Math.PI) * 0.25;
    });
  });

  const gold = <meshStandardMaterial color="#d4af37" metalness={0.5} roughness={0.35} emissive="#3a2a06" />;

  return (
    <group ref={root}>
      {/* back cover (inside shows the final "thank you" page) */}
      <mesh position={[W / 2, 0, BASE]}>
        <boxGeometry args={[W + 0.06, H + 0.08, 0.05]} />
        {gold}
      </mesh>
      <mesh position={[W / 2, 0, BASE + 0.0255]}>
        <planeGeometry args={[W - 0.1, H - 0.1]} />
        <meshStandardMaterial map={sheets.thanks.tex} roughness={0.9} />
      </mesh>

      {/* 6 flip pages */}
      {A.pages.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            leaves.current[i] = el;
          }}
          position={[0, 0, zRight(i)]}
          onClick={(e) => {
            e.stopPropagation();
            onLeaf(i);
          }}
        >
          <mesh position={[W / 2, 0, 0.001]}>
            <planeGeometry args={[W - 0.06, H - 0.06]} />
            <meshStandardMaterial map={sheets.fronts[i].tex} roughness={0.9} />
          </mesh>
          <mesh position={[W / 2, 0, -0.001]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[W - 0.06, H - 0.06]} />
            <meshStandardMaterial map={sheets.back.tex} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* front cover: gold outside, cream inside */}
      <group
        ref={cover}
        position={[0, 0, zCoverClosed]}
        onClick={(e) => {
          e.stopPropagation();
          onCover();
        }}
      >
        <mesh position={[W / 2, 0, 0]}>
          <boxGeometry args={[W + 0.06, H + 0.08, 0.05]} />
          {gold}
        </mesh>
        <mesh position={[W / 2, 0, 0.0255]}>
          <planeGeometry args={[W, H]} />
          <meshStandardMaterial map={sheets.cover.tex} metalness={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[W / 2, 0, -0.0255]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[W - 0.1, H - 0.1]} />
          <meshStandardMaterial map={sheets.inner.tex} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function Rig({ ctrl }) {
  useFrame(({ camera, size }) => {
    const aspect = size.width / size.height;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const needW = lerp(2.9, 5.6, ease(clamp(ctrl.cv, 0, 1)));
    const zW = needW / 2 / (t * aspect);
    const zH = 4.4 / 2 / t;
    camera.position.set(0, 0, Math.max(zW, zH));
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function MemoryAlbum({ onWish }) {
  const [step, setStep] = useState(0); // 0 closed, 1..6 pages, 7 all flipped (thank-you page)
  const gl = useWebGL();
  const ctrl = useRef({
    step: 0,
    cv: 0,
    leaf: Array.from({ length: N }, () => 0),
    nx: 0,
    reduced: false,
  }).current;

  const go = useCallback(
    (d) => {
      const n = clamp(ctrl.step + d, 0, N + 1);
      ctrl.step = n;
      setStep(n);
    },
    [ctrl]
  );

  useEffect(() => {
    ctrl.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo(0, 0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e) {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    function onMove(e) {
      ctrl.nx = (e.clientX / window.innerWidth - 0.5) * 2;
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      document.body.style.overflow = prevOverflow;
    };
  }, [ctrl, go]);

  const onCover = () => go(ctrl.step >= 1 ? -1 : 1);
  const onLeaf = (i) => go(ctrl.step >= i + 2 ? -1 : 1);

  return (
    <div className="album">
        {gl && (
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 40 }}>
        <ambientLight intensity={1.0} />
        <directionalLight position={[2, 3, 5]} intensity={1.5} color="#ffe2b0" />
        <pointLight position={[0, 0, 5]} intensity={14} color="#ffb85c" />
        <PerfGuard />
        <Rig ctrl={ctrl} />
        <Book ctrl={ctrl} onCover={onCover} onLeaf={onLeaf} />
      </Canvas>
      )}
            {gl === false && <AlbumFallback step={step} />}

      <div className="album-ui">
        {step === 0 && (
          <>
            <button className="btn-gold" onClick={() => go(1)} autoFocus>
              {A.open}
            </button>
            <p className="album-hint">{A.hintClosed}</p>
          </>
        )}

        {step >= 1 && step <= N && (
          <>
            <div className="album-nav">
              <button className="btn-ghost" onClick={() => go(-1)}>
                {A.prev}
              </button>
              <span className="album-count" aria-live="polite">
                {step} / {N}
              </span>
              <button className="btn-gold" onClick={() => go(1)}>
                {A.next}
              </button>
            </div>
            <p className="album-hint">{A.hintOpen}</p>
          </>
        )}

        {step === N + 1 && (
          <>
            <p className="album-thanks" aria-live="polite">
              {A.thanks}
            </p>
            <div className="album-nav">
              <button className="btn-ghost" onClick={() => go(-1)}>
                {A.prev}
              </button>
              <button className="btn-gold" onClick={onWish} autoFocus>
                {A.wish}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}