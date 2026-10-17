"use client";
import { useState } from "react";

// 2D photo for the fallbacks: tries NN.webp, then NN.jpg, else a labelled placeholder
export default function PhotoImg({ dir = "photos", index, alt }) {
  const file = String(index + 1).padStart(2, "0");
  const [ext, setExt] = useState("webp");
  if (ext === "none") {
    return (
      <div className="ph" role="img" aria-label={alt}>
        <b>{file}</b>
        <span>PLACEHOLDER</span>
      </div>
    );
  }
  return (
    <img
      src={`/${dir}/${file}.${ext}`}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setExt(ext === "webp" ? "jpg" : "none")}
    />
  );
}