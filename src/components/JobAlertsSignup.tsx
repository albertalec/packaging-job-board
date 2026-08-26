"use client";

import { useState, type FormEvent } from "react";
import { LogoMark } from "@/components/LogoMark";
import { NICHE_LABELS } from "@/lib/niches";
import { US_STATES } from "@/lib/states";
import { useTenant } from "./TenantProvider";

const NICHES = [
  { id: "", label: "All niches" },
  ...Object.entries(NICHE_LABELS).map(([id, label]) => ({ id, label })),
] as const;

type Status = "idle" | "submitting" | "subscribed" | "already_active" | "error";

export function JobAlertsSignup({
  title,
  lede,
  compact = false,
  defaultNiche = "",
}: {
  title: string;
  lede: string;
  compact?: boolean;
  defaultNiche?: string;
}) {
  const tenant = useTenant();
  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState(defaultNiche);
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
    <section
      className={compact ? "board-alerts job-alert-panel" : "board-alerts"}
      id={compact ? "job-alerts" : "alerts"}
    >
      <div className="board-alerts-head">
        <LogoMark variant="avatar" size={compact ? 22 : 26} />
        <h2 className="board-alerts-title">{title}</h2>
      </div>
      <p className="board-alerts-lede">{lede}</p>

      {status === "subscribed" ? (
        <p className="notice" role="status">
          You&apos;re subscribed to {tenant.brand.name}. We&apos;ll email you when
          new matching roles appear.
        </p>
      ) : null}
      {status === "already_active" ? (
        <p className="notice" role="status">
          That address is already subscribed. We sent another welcome email —
          check inbox and spam.
        </p>
      ) : null}

      <form className="board-alerts-form" onSubmit={onSubmit}>
        <label className="board-field board-alerts-email">
          <span className="sr-only">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@work.com"
            disabled={status === "submitting"}
          />
        </label>
        {compact ? null : (
          <>
            <label className="board-field">
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
            <label className="board-field">
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
          </>
        )}
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
          className="board-btn board-btn-primary board-alerts-submit"
          type="submit"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Sending…" : "Get alerts"}
        </button>
      </form>
      {error ? <p className="checkout-error">{error}</p> : null}
    </section>
  );
}
