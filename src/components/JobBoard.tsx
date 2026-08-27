"use client";

import { useEffect, useMemo, useState } from "react";
import type { NormalizedJob } from "../../ingest/types";
import {
  BOARD_PAGE_SIZE,
  clearBoardViewState,
  readBoardViewState,
  writeBoardViewState,
} from "@/lib/board-view-state";
import { parseSearchQuery, searchJobs } from "@/lib/job-search";
import { isRemote } from "@/lib/remote";
import { sectorFilterOptions } from "@/lib/sector-filters";
import {
  compareJobsByPromise,
  compareJobsByRecency,
  sortJobsWithSponsors,
  type BoardSortMode,
} from "@/lib/job-sort";
import { jobState, US_STATES } from "@/lib/states";
import { JobCard } from "./JobCard";
import { useTenant } from "./TenantProvider";

const SORT_OPTIONS: { id: BoardSortMode; label: string }[] = [
  { id: "date", label: "Newest first" },
  { id: "promise", label: "Best match" },
];

const PAGE_SIZE = BOARD_PAGE_SIZE;

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
  const tenant = useTenant();
  const sectors = useMemo(
    () => sectorFilterOptions(tenant.sectorFilters),
    [tenant.sectorFilters],
  );
  const verticalId = tenant.id;
  const sponsoredSet = useMemo(() => new Set(sponsoredIds), [sponsoredIds]);
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [state, setState] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sortMode, setSortMode] = useState<BoardSortMode>("date");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = readBoardViewState(tenant.id);
    if (saved) {
      setQuery(saved.query);
      setNiche(saved.niche);
      setState(saved.state);
      setRemoteOnly(saved.remoteOnly);
      setSortMode(saved.sortMode);
      setVisibleCount(saved.visibleCount);
      if (saved.scrollY > 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, saved.scrollY);
        });
      }
    }
    setHydrated(true);
  }, [tenant.id]);

  useEffect(() => {
    if (!hydrated) return;
    const snapshot = {
      query,
      niche,
      state,
      remoteOnly,
      sortMode,
      visibleCount,
      scrollY: window.scrollY,
    };
    writeBoardViewState(tenant.id, snapshot);
    return () => {
      writeBoardViewState(tenant.id, {
        ...snapshot,
        scrollY: window.scrollY,
      });
    };
  }, [
    hydrated,
    tenant.id,
    query,
    niche,
    state,
    remoteOnly,
    sortMode,
    visibleCount,
  ]);

  const hasFilters = Boolean(query.trim() || niche || state || remoteOnly);
  const tokens = useMemo(() => parseSearchQuery(query), [query]);

  const hits = useMemo(() => {
    const scoped = jobs.filter((job) => {
      if (niche && job.niche !== niche) return false;
      if (state && jobState(job) !== state) return false;
      if (remoteOnly && !job.remote && !isRemote(job.location, job.description)) {
        return false;
      }
      return true;
    });
    const matched = searchJobs(scoped, query);
    if (tokens.length === 0) {
      const sorted = sortJobsWithSponsors(
        matched.map((hit) => hit.job),
        sponsoredSet,
        Date.now(),
        sortMode,
        verticalId,
      );
      return sorted.map((job) => ({ job, score: 0, snippet: null }));
    }
    return [...matched].sort((left, right) => {
      const leftPinned = sponsoredSet.has(left.job.id) ? 1 : 0;
      const rightPinned = sponsoredSet.has(right.job.id) ? 1 : 0;
      if (leftPinned !== rightPinned) return rightPinned - leftPinned;
      if (right.score !== left.score) return right.score - left.score;
      return sortMode === "promise"
        ? compareJobsByPromise(left.job, right.job, Date.now(), verticalId)
        : compareJobsByRecency(left.job, right.job);
    });
  }, [jobs, query, tokens.length, niche, state, remoteOnly, sponsoredSet, sortMode, verticalId]);

  const visible = hits.slice(0, visibleCount);
  const hiddenCount = hits.length - visible.length;

  function clearFilters() {
    setQuery("");
    setNiche("");
    setState("");
    setRemoteOnly(false);
    setVisibleCount(PAGE_SIZE);
    clearBoardViewState(tenant.id);
  }

  function selectNiche(next: string) {
    setNiche(next);
    setVisibleCount(PAGE_SIZE);
  }

  function toggleRemote() {
    setRemoteOnly((prev) => !prev);
    setVisibleCount(PAGE_SIZE);
  }

  function selectSort(next: BoardSortMode) {
    setSortMode(next);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <section id="board" className="board-listing">
      <div className="board-search-bar">
        <label className="board-search">
          <span className="sr-only">Search titles, skills, and posting text</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search titles, skills, posting text"
          />
        </label>
        <div className="board-search-controls">
          <label className="board-field">
            <span className="sr-only">Sector</span>
            <select
              value={niche}
              onChange={(event) => selectNiche(event.target.value)}
            >
              {sectors.map((item) => (
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
        {sectors.map((item) => (
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
        <p>
          {hits.length} live role{hits.length === 1 ? "" : "s"}
        </p>
        <label className="board-sort">
          <span className="sr-only">Sort jobs</span>
          <select
            value={sortMode}
            onChange={(event) => selectSort(event.target.value as BoardSortMode)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hits.length === 0 ? (
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
            {visible.map(({ job, snippet }) => (
              <li key={job.id}>
                <JobCard
                  job={job}
                  sponsored={sponsoredSet.has(job.id)}
                  snippet={snippet}
                  tokens={tokens}
                />
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
