"use client";

import { useState, type FormEvent } from "react";
import { NICHE_LABELS } from "@/lib/niches";
import { US_STATES } from "@/lib/states";

const NICHES = [
  { id: "", label: "All niches" },
  ...Object.entries(NICHE_LABELS).map(([id, label]) => ({ id, label })),
] as const;

type Status = "idle" | "submitting" | "subscribed" | "already_active" | "error";

export function JobAlertsSignup({
  title,
  lede,
}: {
  title: string;
  lede: string;
}) {
  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState("");
  const [state, setState] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          niche: niche || undefined,
          state: state || undefined,
          website,
        }),
      });
      const raw = await response.text();
      let data: {
        ok?: boolean;
        status?: "subscribed" | "already_active" | "pending";
        error?: string;
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setStatus("error");
        setError(
          response.ok
            ? "Unexpected response from server."
            : `Server error (${response.status}). Try again.`,
        );
        return;
      }

      if (!response.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Could not subscribe. Try again.");
        return;
      }

      setStatus(data.status === "already_active" ? "already_active" : "subscribed");
      if (data.status !== "already_active") setEmail("");
    } catch {
      setStatus("error");
      setError("Network error. Try again.");
    }
  }

  return (
    <section className="alerts" id="alerts">
      <div className="alerts-copy">
        <p className="kicker">Free alerts</p>
        <h2 className="alerts-title">{title}</h2>
        <p className="alerts-lede">{lede}</p>
      </div>

      {status === "subscribed" ? (
        <p className="notice" role="status">
          You’re subscribed. We’ll email you when new matching roles appear.
        </p>
      ) : null}
      {status === "already_active" ? (
        <p className="notice" role="status">
          That address is already subscribed. We sent another welcome email —
          check inbox and spam.
        </p>
      ) : null}

      <form className="alerts-form" onSubmit={onSubmit}>
        <label className="alerts-email">
          <span className="sr-only">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            disabled={status === "submitting"}
          />
        </label>
        <label className="filter-select">
          <span className="sr-only">Niche filter</span>
          <select
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            disabled={status === "submitting"}
          >
            {NICHES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-select">
          <span className="sr-only">State filter</span>
          <select
            value={state}
            onChange={(event) => setState(event.target.value)}
            disabled={status === "submitting"}
          >
            <option value="">All states</option>
            {US_STATES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="alerts-hp" aria-hidden="true">
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>
        <button
          className="apply alerts-submit"
          type="submit"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Sending…" : "Get free alerts"}
        </button>
      </form>
      {error ? <p className="checkout-error">{error}</p> : null}
    </section>
  );
}
