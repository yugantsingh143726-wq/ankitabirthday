import { useEffect, useState } from "react";

// true if the browser can create a WebGL context.
// Test switch: open the site with ?nogl=1 to force the 2D fallback.
export function hasWebGL() {
  try {
    if (new URLSearchParams(window.location.search).has("nogl")) return false;
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

// null = still checking, true = 3D available, false = use the 2D fallback
export function useWebGL() {
  const [ok, setOk] = useState(null);
  useEffect(() => {
    setOk(hasWebGL());
  }, []);
  return ok;
}