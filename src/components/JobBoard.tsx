"use client";

import { useMemo, useState } from "react";
import type { NormalizedJob } from "../../ingest/types";
import { NICHE_LABELS } from "@/lib/niches";
import { isRemote } from "@/lib/remote";
import { jobState, US_STATES } from "@/lib/states";
import { JobCard } from "./JobCard";

const NICHES = [
  { id: "", label: "All niches" },
  ...Object.entries(NICHE_LABELS).map(([id, label]) => ({ id, label })),
] as const;

const PAGE_SIZE = 8;

export function JobBoard({
  jobs,
  sponsoredIds,
  empty,
  emptyFiltered,
}: {
  jobs: NormalizedJob[];
  sponsoredIds: string[];
  empty: string;
  emptyFiltered: string;
}) {
  const sponsoredSet = useMemo(() => new Set(sponsoredIds), [sponsoredIds]);
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [state, setState] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const hasFilters = Boolean(query.trim() || niche || state || remoteOnly);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (niche && job.niche !== niche) return false;
      if (state && jobState(job) !== state) return false;
      if (remoteOnly && !job.remote && !isRemote(job.location, job.description)) {
        return false;
      }
      if (!needle) return true;
      return `${job.title} ${job.company} ${job.location}`
        .toLowerCase()
        .includes(needle);
    });
  }, [jobs, query, niche, state, remoteOnly]);

  const visible = filtered.slice(0, visibleCount);
  const hiddenCount = filtered.length - visible.length;

  function clearFilters() {
    setQuery("");
    setNiche("");
    setState("");
    setRemoteOnly(false);
    setVisibleCount(PAGE_SIZE);
  }

  function selectNiche(next: string) {
    setNiche(next);
    setVisibleCount(PAGE_SIZE);
  }

  function toggleRemote() {
    setRemoteOnly((prev) => !prev);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <section id="board" className="board-listing">
      <div className="board-search-bar">
        <label className="board-search">
          <span className="sr-only">Search jobs</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search titles, employers, locations"
          />
        </label>
        <div className="board-search-controls">
          <label className="board-field">
            <span className="sr-only">Niche</span>
            <select
              value={niche}
              onChange={(event) => selectNiche(event.target.value)}
            >
              {NICHES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="board-field">
            <span className="sr-only">State</span>
            <select
              value={state}
              onChange={(event) => {
                setState(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              <option value="">All states</option>
              {US_STATES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={`board-chip${remoteOnly ? " is-active" : ""}`}
            aria-pressed={remoteOnly}
            onClick={toggleRemote}
          >
            Remote / hybrid
          </button>
        </div>
      </div>

      <div className="board-chip-row" role="group" aria-label="Filter by sector">
        {NICHES.map((item) => (
          <button
            key={item.id || "all"}
            type="button"
            className={`board-chip${niche === item.id ? " is-active" : ""}`}
            aria-pressed={niche === item.id}
            onClick={() => selectNiche(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="board-list-head">
        <p>{filtered.length} live roles</p>
        <p>Newest first</p>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          {hasFilters ? (
            <>
              {emptyFiltered}{" "}
              <button type="button" className="empty-clear" onClick={clearFilters}>
                Clear filters
              </button>
            </>
          ) : (
            empty
          )}
        </p>
      ) : (
        <>
          <ul className="job-list">
            {visible.map((job) => (
              <li key={job.id}>
                <JobCard job={job} sponsored={sponsoredSet.has(job.id)} />
              </li>
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <div className="board-more-wrap">
              <button
                type="button"
                className="board-btn board-btn-outline"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Show {hiddenCount} more role{hiddenCount === 1 ? "" : "s"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
