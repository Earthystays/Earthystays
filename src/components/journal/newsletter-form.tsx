"use client";

import { useState } from "react";
import { toast } from "sonner";

export function NewsletterForm({
  source = "journal",
  variant = "inline",
}: {
  source?: string;
  variant?: "inline" | "stacked";
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/journal/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("You're subscribed. Welcome to the Journal.");
        setEmail("");
      } else {
        toast.error(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        variant === "inline"
          ? "flex w-full max-w-md flex-col gap-3 sm:flex-row"
          : "flex w-full flex-col gap-3"
      }
    >
      <label htmlFor={`nl-${source}`} className="sr-only">
        Email address
      </label>
      <input
        id={`nl-${source}`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm text-foreground outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-forest px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-forest-deep disabled:opacity-60"
      >
        {loading ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}
