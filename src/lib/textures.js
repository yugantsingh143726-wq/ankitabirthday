import * as THREE from "three";

// Aspect used by the Polaroid photo area (1.1 x 1.375 = 4:5 portrait)
const ASPECT = 0.8;

// Center-crops the image to 4:5 and downsizes it, so a 4000px phone photo
// does not eat GPU memory (spec: hero/gallery textures 512-768px).
function cropToCanvas(img, maxH) {
  let sw = img.width;
  let sh = img.height;
  if (sw / sh > ASPECT) sw = sh * ASPECT;
  else sh = sw / ASPECT;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  const h = Math.min(maxH, Math.round(sh));
  const w = Math.round(h * ASPECT);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  return c;
}

// Loads /photos/NN.webp, then /photos/NN.jpg. If neither exists, onTexture is
// never called (the caller keeps its labelled placeholder).
// Returns a cancel function.
export function loadPhotoTexture(index, maxH, onTexture) {
  let dead = false;
  const file = String(index + 1).padStart(2, "0");
  const tryExt = (ext, onFail) => {
    const img = new Image();
    img.onload = () => {
      if (dead) return;
      const tex = new THREE.CanvasTexture(cropToCanvas(img, maxH));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      onTexture(tex);
    };
    img.onerror = onFail;
    img.src = `/photos/${file}.${ext}`;
  };
  tryExt("jpg", () => tryExt("webp", () => {}));
  return () => {
    dead = true;
  };
}