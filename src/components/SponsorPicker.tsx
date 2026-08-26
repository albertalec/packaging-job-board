"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ListingRail } from "@/components/JobCard";

export type SponsorPick = {
  id: string;
  title: string;
  company: string;
  location: string;
  rail: ListingRail;
};

export function SponsorPicker({ jobs }: { jobs: SponsorPick[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return jobs;
    return jobs.filter((job) =>
      `${job.title} ${job.company}`.toLowerCase().includes(needle),
    );
  }, [jobs, query]);

  if (jobs.length === 0) {
    return (
      <p className="empty">
        No live roles to pin yet. Check back after the next daily update.
      </p>
    );
  }

  return (
    <div className="board-sponsor-picker">
      <label className="board-search">
        <span className="sr-only">Search listings by title or company</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title or company"
        />
      </label>
      <p className="board-sponsor-picker-count">
        {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
      </p>
      {filtered.length === 0 ? (
        <p className="empty">
          No listings match.{" "}
          <button type="button" className="empty-clear" onClick={() => setQuery("")}>
            Clear search
          </button>
        </p>
      ) : (
        <ul className="board-sponsor-pick-list">
          {filtered.map((job) => (
            <li key={job.id}>
              <Link
                className={`board-sponsor-pick${job.rail === "new" ? " is-new" : ""}${job.rail === "pinned" ? " is-pinned" : ""}`}
                href={`/sponsor/${job.id}`}
              >
                <span className="board-sponsor-pick-copy">
                  <span className="board-sponsor-pick-company">{job.company}</span>
                  <span className="board-sponsor-pick-title">{job.title}</span>
                  <span className="board-sponsor-pick-meta">{job.location}</span>
                </span>
                <span className="board-sponsor-pick-cta">Pin this listing →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
