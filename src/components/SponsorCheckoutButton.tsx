"use client";

import { useState } from "react";

export function SponsorCheckoutButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Checkout could not be started.");
      }
      window.location.href = payload.url;
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Checkout could not be started.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="checkout-wrap">
      <button
        type="button"
        className="apply big checkout"
        onClick={startCheckout}
        disabled={loading}
      >
        {loading ? "Redirecting to Stripe…" : "Pay $100 with card"}
      </button>
      {error ? <p className="checkout-error">{error}</p> : null}
    </div>
  );
}
