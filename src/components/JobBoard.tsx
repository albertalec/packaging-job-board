"use client";

import { useMemo, useState } from "react";
import type { NormalizedJob } from "../../ingest/types";
import { jobState, US_STATES } from "@/lib/states";
import { JobCard } from "./JobCard";

const NICHES = [
  { id: "", label: "All niches" },
  { id: "cpg", label: "CPG" },
  { id: "food-beverage", label: "Food & beverage" },
  { id: "automotive", label: "Automotive" },
  { id: "pharma", label: "Pharma" },
  { id: "industrial", label: "Industrial" },
] as const;

export function JobBoard({
  jobs,
  sponsoredIds,
}: {
  jobs: NormalizedJob[];
  sponsoredIds: string[];
}) {
  const sponsoredSet = useMemo(() => new Set(sponsoredIds), [sponsoredIds]);
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [state, setState] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (niche && job.niche !== niche) return false;
      if (state && jobState(job) !== state) return false;
      if (remoteOnly && !job.remote) return false;
      if (!needle) return true;
      return `${job.title} ${job.company} ${job.location}`
        .toLowerCase()
        .includes(needle);
    });
  }, [jobs, query, niche, state, remoteOnly]);

  return (
    <section>
      <div className="filters">
        <label className="search">
          <span className="sr-only">Search jobs</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, company, city"
          />
        </label>
        <label className="filter-select">
          <span className="sr-only">Niche</span>
          <select value={niche} onChange={(event) => setNiche(event.target.value)}>
            {NICHES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-select">
          <span className="sr-only">State</span>
          <select value={state} onChange={(event) => setState(event.target.value)}>
            <option value="">All states</option>
            {US_STATES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(event) => setRemoteOnly(event.target.checked)}
          />
          Remote / hybrid
        </label>
        <p className="count">{filtered.length} live roles</p>
      </div>
      {filtered.length === 0 ? (
        <p className="empty">
          No matching packaging roles in the latest ingest. Run{" "}
          <code>npm run ingest</code> to refresh employer feeds.
        </p>
      ) : (
        <ul className="job-list">
          {filtered.map((job) => (
            <li key={job.id}>
              <JobCard job={job} sponsored={sponsoredSet.has(job.id)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
