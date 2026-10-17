"use client";
import { site } from "../content/site";
import PhotoImg from "./PhotoImg";

const A = site.album;
const N = A.pages.length;

// 2D album page (used when WebGL is unavailable). Buttons come from MemoryAlbum.
export default function AlbumFallback({ step }) {
  return (
    <div className="album-fb">
      {step === 0 && (
        <div className="fb-cover">
          <h2>{A.coverTitle}</h2>
          <p>{A.coverSub}</p>
        </div>
      )}
      {step >= 1 && step <= N && (
        <figure className="fb-page" key={step}>
          <PhotoImg dir="album" index={step - 1} alt={A.pages[step - 1].caption} />
          <figcaption>{A.pages[step - 1].caption}</figcaption>
        </figure>
      )}
      {step === N + 1 && (
        <div className="fb-page fb-thanks">
          <p>{A.thanks}</p>
        </div>
      )}
    </div>
  );
}