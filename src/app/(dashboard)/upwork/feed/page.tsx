"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  RotateCcw,
  Rss,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import type { FeedJob } from "@/lib/db/schema";

const PAGE_SIZE = 20;
const STALE_MS = 24 * 60 * 60 * 1000;

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function isStale(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() > STALE_MS;
}

function parseBudgetNum(budget: string | null): number {
  if (!budget) return 0;
  const match = budget.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function parseProposalNum(proposals: string | null): number {
  if (!proposals) return 0;
  const lower = proposals.toLowerCase();
  const match = proposals.match(/\d+/);
  if (!match) return 0;
  const num = parseInt(match[0]);
  if (lower.includes("fewer") || lower.includes("less")) return num - 1;
  return num;
}

function parseSpentNum(spent: string | null): number {
  if (!spent) return 0;
  const cleaned = spent.replace(/[,$]/g, "").toLowerCase();
  const match = cleaned.match(/[\d.]+/);
  if (!match) return 0;
  const num = parseFloat(match[0]);
  if (cleaned.includes("m")) return num * 1_000_000;
  if (cleaned.includes("k")) return num * 1_000;
  return num;
}

type SortKey = "newest" | "oldest" | "budget_high" | "budget_low" | "proposals_low" | "rating_high";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "budget_high", label: "Budget: high to low" },
  { value: "budget_low", label: "Budget: low to high" },
  { value: "proposals_low", label: "Fewest proposals" },
  { value: "rating_high", label: "Highest client rating" },
];

const BUDGET_RANGES = [
  { label: "Any", min: 0, max: Infinity },
  { label: "Under $100", min: 0, max: 100 },
  { label: "$100 - $500", min: 100, max: 500 },
  { label: "$500 - $1k", min: 500, max: 1000 },
  { label: "$1k - $5k", min: 1000, max: 5000 },
  { label: "$5k+", min: 5000, max: Infinity },
];

const PROPOSAL_RANGES = [
  { label: "Any", min: 0, max: Infinity },
  { label: "Under 5", min: 0, max: 5 },
  { label: "5 - 10", min: 5, max: 10 },
  { label: "10 - 20", min: 10, max: 20 },
  { label: "20+", min: 20, max: Infinity },
];

const SPENT_RANGES = [
  { label: "Any", min: 0, max: Infinity },
  { label: "$1k+", min: 1000, max: Infinity },
  { label: "$10k+", min: 10000, max: Infinity },
  { label: "$50k+", min: 50000, max: Infinity },
  { label: "$100k+", min: 100000, max: Infinity },
];

const RATING_OPTIONS = [
  { label: "Any", min: 0 },
  { label: "4.0+", min: 4.0 },
  { label: "4.5+", min: 4.5 },
  { label: "4.8+", min: 4.8 },
];

export default function FeedPage() {
  const [jobs, setJobs] = useState<FeedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDismissed, setShowDismissed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [budgetRange, setBudgetRange] = useState(0);
  const [proposalRange, setProposalRange] = useState(0);
  const [spentRange, setSpentRange] = useState(0);
  const [ratingMin, setRatingMin] = useState(0);
  const [page, setPage] = useState(1);

  const fetchJobs = useCallback(async () => {
    const qs = showDismissed ? "?dismissed=true" : "";
    const res = await fetch(`/api/feed-jobs${qs}`);
    if (res.ok) {
      const data = await res.json();
      setJobs(data.jobs);
    }
    setLoading(false);
  }, [showDismissed]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const allSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      const skills: string[] = job.skillsJson ? JSON.parse(job.skillsJson) : [];
      for (const s of skills) {
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [jobs]);

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    const budget = BUDGET_RANGES[budgetRange];
    const proposal = PROPOSAL_RANGES[proposalRange];
    const spent = SPENT_RANGES[spentRange];
    const rating = RATING_OPTIONS[ratingMin];

    let result = showDismissed ? jobs : jobs.filter((j) => !j.dismissed);

    result = result.filter((job) => {
      if (searchLower) {
        const haystack = `${job.title} ${job.description ?? ""}`.toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }

      if (selectedSkills.size > 0) {
        const jobSkills: string[] = job.skillsJson ? JSON.parse(job.skillsJson) : [];
        const hasMatch = jobSkills.some((s) => selectedSkills.has(s));
        if (!hasMatch) return false;
      }

      if (budget.max !== Infinity || budget.min > 0) {
        const val = parseBudgetNum(job.budget);
        if (val < budget.min || val > budget.max) return false;
      }

      if (proposal.max !== Infinity || proposal.min > 0) {
        const val = parseProposalNum(job.proposals);
        if (val < proposal.min || val > proposal.max) return false;
      }

      if (spent.min > 0) {
        const val = parseSpentNum(job.clientTotalSpent);
        if (val < spent.min) return false;
      }

      if (rating.min > 0) {
        const val = parseFloat(job.clientRating ?? "0");
        if (val < rating.min) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b.postedAt ?? "").localeCompare(a.postedAt ?? "");
        case "oldest":
          return (a.postedAt ?? "").localeCompare(b.postedAt ?? "");
        case "budget_high":
          return parseBudgetNum(b.budget) - parseBudgetNum(a.budget);
        case "budget_low":
          return parseBudgetNum(a.budget) - parseBudgetNum(b.budget);
        case "proposals_low":
          return parseProposalNum(a.proposals) - parseProposalNum(b.proposals);
        case "rating_high":
          return parseFloat(b.clientRating ?? "0") - parseFloat(a.clientRating ?? "0");
      }
    });

    return result;
  }, [jobs, search, sortBy, selectedSkills, budgetRange, proposalRange, spentRange, ratingMin, showDismissed]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const pageJobs = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, selectedSkills, budgetRange, proposalRange, spentRange, ratingMin, showDismissed]);

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }

  const activeFilterCount =
    (selectedSkills.size > 0 ? 1 : 0) +
    (budgetRange > 0 ? 1 : 0) +
    (proposalRange > 0 ? 1 : 0) +
    (spentRange > 0 ? 1 : 0) +
    (ratingMin > 0 ? 1 : 0);

  function clearFilters() {
    setSelectedSkills(new Set());
    setBudgetRange(0);
    setProposalRange(0);
    setSpentRange(0);
    setRatingMin(0);
    setSearch("");
  }

  async function dismiss(id: number) {
    await fetch(`/api/feed-jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: 1 }),
    });
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  async function restore(id: number) {
    await fetch(`/api/feed-jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: 0 }),
    });
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, dismissed: 0 } : j)),
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-bone-dim" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/upwork"
            className="inline-flex items-center gap-1.5 text-xs text-bone-dim hover:text-bone transition-colors mb-3"
          >
            <ArrowLeft size={12} />
            Upwork
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Job Feed
          </h1>
          <p className="mt-1 text-sm text-bone-dim">
            {filtered.length} job{filtered.length !== 1 ? "s" : ""}
            {activeFilterCount > 0 || search ? " matching filters" : " discovered"}
          </p>
        </div>
        <button
          onClick={() => setShowDismissed(!showDismissed)}
          className="flex items-center gap-1.5 mt-6 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-bone transition-colors"
        >
          {showDismissed ? <EyeOff size={12} /> : <Eye size={12} />}
          {showDismissed ? "Hide Dismissed" : "Show Dismissed"}
        </button>
      </div>

      {/* Search + Sort + Filter toggle */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-dim/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job titles and descriptions..."
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-bone placeholder:text-bone-dim/40 focus:border-accent focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-bone-dim/40 hover:text-bone transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-bone focus:border-accent focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-accent/40 text-accent bg-accent/5"
                : "border-border text-bone-dim hover:text-bone"
            }`}
          >
            <SlidersHorizontal size={12} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-accent text-ink-deep text-[10px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={12} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="p-4 rounded-xl bg-surface border border-border">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <FilterSelect
                label="Budget"
                value={budgetRange}
                onChange={setBudgetRange}
                options={BUDGET_RANGES.map((r) => r.label)}
              />
              <FilterSelect
                label="Proposals"
                value={proposalRange}
                onChange={setProposalRange}
                options={PROPOSAL_RANGES.map((r) => r.label)}
              />
              <FilterSelect
                label="Client Spent"
                value={spentRange}
                onChange={setSpentRange}
                options={SPENT_RANGES.map((r) => r.label)}
              />
              <FilterSelect
                label="Client Rating"
                value={ratingMin}
                onChange={setRatingMin}
                options={RATING_OPTIONS.map((r) => r.label)}
              />
            </div>

            {/* Skills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                  Skills / Technologies
                </span>
                {selectedSkills.size > 0 && (
                  <button
                    onClick={() => setSelectedSkills(new Set())}
                    className="text-[10px] text-bone-dim/50 hover:text-bone transition-colors"
                  >
                    Clear skills
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allSkills.slice(0, 30).map(({ name, count }) => (
                  <button
                    key={name}
                    onClick={() => toggleSkill(name)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      selectedSkills.has(name)
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-surface-raised text-bone-dim/60 border border-transparent hover:text-bone-dim"
                    }`}
                  >
                    {name}
                    <span className="ml-1 opacity-50">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-3 pt-3 border-t border-border-subtle">
                <button
                  onClick={clearFilters}
                  className="text-xs text-bone-dim/50 hover:text-bone transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Job list */}
      {pageJobs.length === 0 ? (
        <div className="text-center py-16">
          <Rss size={32} className="mx-auto mb-3 text-bone-dim/30" />
          {jobs.length === 0 ? (
            <>
              <p className="text-sm text-bone-dim/50 mb-2">
                No jobs in the feed yet.
              </p>
              <p className="text-xs text-bone-dim/40 max-w-md mx-auto">
                Install the Upwork Job Scraper browser extension and point its
                webhook to{" "}
                <code className="px-1.5 py-0.5 rounded bg-surface-raised text-[11px] font-mono text-bone-dim">
                  {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/webhook/jobs
                </code>
              </p>
            </>
          ) : (
            <p className="text-sm text-bone-dim/50">
              No jobs match your current filters.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {pageJobs.map((job) => {
              const skills: string[] = job.skillsJson
                ? JSON.parse(job.skillsJson)
                : [];
              const isPromoted = !!job.promotedJobId;
              const stale = isStale(job.lastSeenAt);

              return (
                <section
                  key={job.id}
                  className={`p-4 rounded-xl bg-surface border transition-colors ${
                    isPromoted
                      ? "border-accent/20 opacity-70"
                      : job.dismissed
                        ? "border-border opacity-50"
                        : stale
                          ? "border-amber-500/20 opacity-60"
                          : "border-border hover:border-border/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/upwork/feed/${job.id}`}
                          className="font-display text-sm font-semibold truncate hover:text-accent transition-colors"
                        >
                          {job.title}
                        </Link>
                        {isPromoted && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent/15 text-accent">
                            Tracked
                          </span>
                        )}
                        {stale && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400">
                            Stale
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-bone-dim">
                        {job.budget && <span>{job.budget}</span>}
                        {job.jobType && (
                          <span className="text-bone-dim/50">{job.jobType}</span>
                        )}
                        {job.experienceLevel && (
                          <span className="text-bone-dim/50">
                            {job.experienceLevel}
                          </span>
                        )}
                        {job.proposals && (
                          <span className="text-bone-dim/50">
                            {job.proposals} proposals
                          </span>
                        )}
                        {job.clientRating && (
                          <span className="flex items-center gap-0.5 text-bone-dim/50">
                            <Star size={10} />
                            {job.clientRating}
                          </span>
                        )}
                        {job.clientTotalSpent && (
                          <span className="text-bone-dim/50">
                            {job.clientTotalSpent}
                          </span>
                        )}
                        {job.postedAt && (
                          <span className="flex items-center gap-0.5 text-bone-dim/40">
                            <Clock size={10} />
                            {timeAgo(job.postedAt)}
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-xs text-bone-dim/60 leading-relaxed line-clamp-2 mt-1.5">
                          {job.description}
                        </p>
                      )}

                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {skills.map((s) => (
                            <span
                              key={s}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                selectedSkills.has(s)
                                  ? "bg-accent/15 text-accent"
                                  : "bg-surface-raised text-bone-dim/60"
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      <Link
                        href={`/upwork/feed/${job.id}`}
                        className="p-1.5 rounded-md text-bone-dim hover:text-bone hover:bg-surface-raised transition-colors"
                        title="View details"
                      >
                        <FileText size={14} />
                      </Link>
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-bone-dim hover:text-bone hover:bg-surface-raised transition-colors"
                          title="View on Upwork"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {isPromoted && (
                        <Link
                          href={`/upwork/jobs/${job.promotedJobId}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-accent/30 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
                        >
                          Tracked
                          <ArrowRight size={12} />
                        </Link>
                      )}
                      {!isPromoted && !job.dismissed && (
                        <button
                          onClick={() => dismiss(job.id)}
                          className="p-1.5 rounded-md text-bone-dim/50 hover:text-red-400 hover:bg-surface-raised transition-colors"
                          title="Dismiss"
                        >
                          <X size={14} />
                        </button>
                      )}
                      {!isPromoted && !!job.dismissed && (
                        <button
                          onClick={() => restore(job.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-bone-dim/50 hover:text-accent hover:bg-surface-raised transition-colors"
                          title="Restore to feed"
                        >
                          <RotateCcw size={12} />
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
              <p className="text-xs text-bone-dim/50">
                {(safeCurrentPage - 1) * PAGE_SIZE + 1}--{Math.min(safeCurrentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="px-2 py-1 rounded text-xs text-bone-dim hover:text-bone disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1 rounded text-bone-dim hover:text-bone hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {paginationRange(safeCurrentPage, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-bone-dim/30">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`min-w-7 h-7 rounded text-xs font-medium transition-colors ${
                        p === safeCurrentPage
                          ? "bg-accent text-ink-deep"
                          : "text-bone-dim hover:text-bone hover:bg-surface-raised"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1 rounded text-bone-dim hover:text-bone hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="px-2 py-1 rounded text-xs text-bone-dim hover:text-bone disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-border bg-ink px-3 py-1.5 text-xs text-bone focus:border-accent focus:outline-none"
      >
        {options.map((opt, i) => (
          <option key={opt} value={i}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function paginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
