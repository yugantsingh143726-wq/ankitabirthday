"use client";
import { useState } from "react";
import { site } from "../content/site";
import GiftIllustration from "./GiftIllustration";

export default function BirthYearGate({ onSuccess }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim() === site.birthYear) {
      onSuccess();
    } else {
      setError(true);
    }
  }

  function retry() {
    setValue("");
    setError(false);
  }

  return (
    <main className="gate">
      <div className="gate-card">
        <div className="gate-art" aria-hidden="true">
          <GiftIllustration />
        </div>
        <form className="gate-panel" onSubmit={handleSubmit}>
          <h1>
            {site.gate.title} <span className="accent">{site.gate.titleAccent}</span>
          </h1>
          <label htmlFor="year">{site.gate.prompt}</label>
          <input
            id="year"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder={site.gate.placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            disabled={error}
            autoFocus
          />
          {error ? (
            <>
              <p className="gate-error" role="alert">{site.gate.error}</p>
              <button type="button" onClick={retry}>{site.gate.retry}</button>
            </>
          ) : (
            <button type="submit">{site.gate.button}</button>
          )}
        </form>
      </div>
            <p className="gate-hint">{site.gate.hint}</p>
    </main>
  );
}