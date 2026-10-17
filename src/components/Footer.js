"use client";
import { site } from "../content/site";

export default function Footer({ onReplay }) {
  return (
    <footer className="site-footer">
      <p>{site.footer.madeBy}</p>
      <p className="footer-hb">{site.footer.happy}</p>
      <button className="btn-ghost" onClick={onReplay}>
        {site.footer.replay}
      </button>
    </footer>
  );
}