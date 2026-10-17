"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "../content/site";
import { startRingtone } from "../lib/ringtone";

const C = site.call;
const AVATARS = ["/call/profile.webp", "/call/profile.jpg"];
// The call always lasts this many seconds, then ends by itself (change here if needed)
const CALL_SECONDS = C.durationSec || 10;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const PHONE =
  "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z";

export default function IncomingCall({ onOpenAlbum }) {
  const [phase, setPhase] = useState("incoming"); // incoming | active | ended
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [taunt, setTaunt] = useState("");
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [secs, setSecs] = useState(0);
  const [endedSecs, setEndedSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camState, setCamState] = useState("off"); // asking | live | off
  const [reelMissing, setReelMissing] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  const declineRef = useRef(null);
  const acceptRef = useRef(null);
  const offRef = useRef({ x: 0, y: 0 });
  const baseRef = useRef(null);
  const tauntN = useRef(0);
  const videoRef = useRef(null);
  const camVideoRef = useRef(null);
  const streamRef = useRef(null);
  const camToken = useRef(0);
  const secsRef = useRef(0);

  // Lock page scroll while the call screen is open
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Ringtone only while the call is incoming
  useEffect(() => {
    if (phase !== "incoming") return;
    const stop = startRingtone();
    return stop;
  }, [phase]);

  // Reset dodge geometry on resize
  useEffect(() => {
    function onResize() {
      baseRef.current = null;
      offRef.current = { x: 0, y: 0 };
      setOff({ x: 0, y: 0 });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ---- Camera: only after the browser permission prompt; never recorded ----
  const stopCamera = useCallback(() => {
    camToken.current += 1; // invalidates any pending request
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (camVideoRef.current) camVideoRef.current.srcObject = null;
    setCamState("off");
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamState("off");
      return;
    }
    const token = ++camToken.current;
    setCamState("asking");
    // After 6s without a stream, fall back to the profile photo
    const timer = setTimeout(() => {
      if (camToken.current === token) setCamState("off");
    }, 6000);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      clearTimeout(timer);
      if (camToken.current !== token) {
        stream.getTracks().forEach((t) => t.stop()); // call ended meanwhile
        return;
      }
      streamRef.current = stream;
      setCamState("live");
    } catch (e) {
      clearTimeout(timer);
      if (camToken.current === token) setCamState("off"); // denied / unavailable
    }
  }, []);

  useEffect(() => {
    if (camState === "live" && camVideoRef.current && streamRef.current) {
      camVideoRef.current.srcObject = streamRef.current;
      camVideoRef.current.play().catch(() => {});
    }
  }, [camState]);

  useEffect(() => stopCamera, [stopCamera]); // stop tracks on unmount

  // ---- Call flow ----
  const accept = useCallback(() => {
    secsRef.current = 0;
    setSecs(0);
    setMuted(false);
    setNeedsTap(false);
    setPhase("active");
    startCamera();
  }, [startCamera]);

  const endCall = useCallback(() => {
    stopCamera();
    if (videoRef.current) videoRef.current.pause();
    setEndedSecs(secsRef.current);
    setPhase("ended");
  }, [stopCamera]);

  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => {
      secsRef.current += 1;
      setSecs(secsRef.current);
      // auto-end after CALL_SECONDS, whatever the reel length is
      if (secsRef.current >= CALL_SECONDS) {
        clearInterval(id);
        endCall();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, endCall]);

  useEffect(() => {
    if (phase !== "active" || reelMissing) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    const p = v.play();
    if (p && p.catch) p.catch(() => setNeedsTap(true));
  }, [phase, reelMissing]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, phase]);

  // ---- Decline: always dodges, never works ----
  const dodge = useCallback(() => {
    const el = declineRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cur = offRef.current;
    if (!baseRef.current)
      baseRef.current = { x: r.left - cur.x, y: r.top - cur.y };
    const { x: baseX, y: baseY } = baseRef.current;
    const pad = 12;
    const loX = pad - baseX;
    const hiX = window.innerWidth - r.width - pad - baseX;
    const loY = pad - baseY;
    const hiY = window.innerHeight - r.height - pad - baseY;
    const a = acceptRef.current
      ? acceptRef.current.getBoundingClientRect()
      : null;

    let next = cur;
    for (let i = 0; i < 12; i++) {
      const nx = clamp(cur.x + (Math.random() - 0.5) * 340, loX, hiX);
      const ny = clamp(cur.y + (Math.random() - 0.5) * 340, loY, hiY);
      const L = baseX + nx;
      const T = baseY + ny;
      const hitsAccept =
        a &&
        L < a.right + 16 &&
        L + r.width > a.left - 16 &&
        T < a.bottom + 16 &&
        T + r.height > a.top - 16;
      if (!hitsAccept && Math.hypot(nx - cur.x, ny - cur.y) > 90) {
        next = { x: nx, y: ny };
        break;
      }
    }
    offRef.current = next;
    setOff(next);
    const n = tauntN.current++;
    setTaunt(C.taunts[n % C.taunts.length]);
  }, []);

  const avatarSrc = AVATARS[avatarIdx];

  return (
    <div className={`call ${phase}`} role="dialog" aria-label={C.callerName}>
      {phase === "active" &&
        (reelMissing ? (
          <div className="reel-placeholder">
            <p>{C.reelPlaceholder}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="reel"
            src="/call/reel.mp4"
            poster="/call/reel-poster.webp"
            playsInline
            autoPlay
            loop
            preload="auto"
            onError={() => setReelMissing(true)}
          />
        ))}

      {phase !== "ended" && (
        <div className="call-avatar">
          {camState === "live" ? (
            <video
              ref={camVideoRef}
              className="call-cam"
              muted
              playsInline
              autoPlay
            />
          ) : avatarSrc ? (
            <img
              src={avatarSrc}
              alt={C.callerName}
              onError={() => setAvatarIdx((i) => i + 1)}
            />
          ) : (
            <span className="avatar-ph">{C.avatarPlaceholder}</span>
          )}
        </div>
      )}

      {phase === "incoming" && (
        <>
          <div className="call-info">
            <h1>{C.callerName}</h1>
            <p>{C.incomingLabel}</p>
          </div>
          <p className="call-taunt" aria-live="polite">
            {taunt}
          </p>
          <div className="call-controls">
            <div
              ref={declineRef}
              className="dodge"
              style={{ transform: `translate(${off.x}px, ${off.y}px)` }}
              onPointerEnter={dodge}
              onPointerDown={dodge}
            >
              <button
                className="btn3d decline"
                aria-label={C.declineAria}
                onFocus={dodge}
                onClick={dodge}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  style={{ transform: "rotate(135deg)" }}
                >
                  <path d={PHONE} />
                </svg>
              </button>
              <span className="call-label">{C.decline}</span>
            </div>

            <div ref={acceptRef} className="call-ctl">
              <button
                className="btn3d accept"
                aria-label={C.accept}
                onClick={accept}
                autoFocus
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={PHONE} />
                </svg>
              </button>
              <span className="call-label">{C.accept}</span>
            </div>
          </div>
        </>
      )}

      {phase === "active" && (
        <>
          <div className="call-top">
            <div className="row">
              <h2>{C.callerName}</h2>
              <span className="call-timer" aria-label="Call timer">
                {fmt(secs)}
              </span>
            </div>
            <span className="call-enc">🔒 {C.encrypted}</span>
          </div>
          <p className="call-special">{C.specialMessage}</p>

          {needsTap && (
            <button
              className="btn-gold tap-play"
              onClick={() => {
                const v = videoRef.current;
                if (v)
                  v.play()
                    .then(() => setNeedsTap(false))
                    .catch(() => {});
              }}
            >
              {C.tapToPlay}
            </button>
          )}

          <div className="call-bar">
            <div className="call-ctl">
              <button
                className="btn3d small"
                aria-label={muted ? C.unmute : C.mute}
                aria-pressed={muted}
                onClick={() => setMuted((m) => !m)}
              >
                <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
              </button>
              <span className="call-label">{muted ? C.unmute : C.mute}</span>
            </div>
            <div className="call-ctl">
              <button
                className="btn3d small"
                aria-label={camState === "live" ? C.cameraOff : C.cameraOn}
                aria-pressed={camState === "live"}
                onClick={() =>
                  camState === "live" || camState === "asking"
                    ? stopCamera()
                    : startCamera()
                }
              >
                <span aria-hidden="true">📷</span>
              </button>
              <span className="call-label">
                {camState === "live" ? C.cameraOff : C.cameraOn}
              </span>
            </div>
            <div className="call-ctl">
              <button
                className="btn3d small decline"
                aria-label={C.end}
                onClick={endCall}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  style={{ transform: "rotate(135deg)" }}
                >
                  <path d={PHONE} />
                </svg>
              </button>
              <span className="call-label">{C.end}</span>
            </div>
          </div>
        </>
      )}

      {phase === "ended" && (
        <div className="call-ended">
          <div className="ended-card">
            <h2>{C.endedTitle}</h2>
            <p>{fmt(endedSecs)}</p>
            <div className="ended-actions">
              <button className="btn-gold" onClick={accept}>
                {C.watchAgain}
              </button>
              <button className="btn-ghost" onClick={onOpenAlbum}>
                {C.openAlbum}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
