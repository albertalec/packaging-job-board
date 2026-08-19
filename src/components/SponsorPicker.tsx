"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type SponsorPick = {
  id: string;
  title: string;
  company: string;
  location: string;
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
    <div className="sponsor-picker">
      <label className="search">
        <span className="sr-only">Search listings by title or company</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title or company"
        />
      </label>
      <p className="count">
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
        <ul className="sponsor-pick-list">
          {filtered.map((job) => (
            <li key={job.id}>
              <Link href={`/sponsor/${job.id}`}>
                <span className="pick-title">{job.title}</span>
                <span className="pick-meta">
                  {job.company} · {job.location}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
