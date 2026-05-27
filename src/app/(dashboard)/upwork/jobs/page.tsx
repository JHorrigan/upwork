"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import type { Job } from "@/lib/db/schema";

const STATUSES = [
  "all",
  "draft",
  "submitted",
  "viewed",
  "interview",
  "won",
  "completed",
  "lost",
] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-bone-dim/20 text-bone-dim",
  submitted: "bg-blue-500/15 text-blue-400",
  viewed: "bg-purple-500/15 text-purple-400",
  interview: "bg-amber-500/15 text-amber-400",
  won: "bg-accent/15 text-accent",
  completed: "bg-emerald-500/15 text-emerald-400",
  lost: "bg-red-500/15 text-red-400",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchJobs = useCallback(async () => {
    const params = filter !== "all" ? `?status=${filter}` : "";
    const res = await fetch(`/api/jobs${params}`);
    if (res.ok) {
      const data = await res.json();
      setJobs(data.jobs);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const counts = jobs.reduce(
    (acc, j) => {
      acc[j.status] = (acc[j.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="p-8 max-w-4xl">
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
            Jobs
          </h1>
        </div>
        <Link
          href="/upwork/jobs/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all mt-6"
        >
          <Plus size={14} />
          Add Job
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilter(s);
              setLoading(true);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? "bg-surface-raised text-bone"
                : "text-bone-dim hover:text-bone"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && counts[s] ? (
              <span className="ml-1.5 text-bone-dim/50">{counts[s]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-bone-dim" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-bone-dim">No jobs yet.</p>
          <p className="text-xs text-bone-dim/50 mt-1">
            Add your first job to start tracking proposals.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/upwork/jobs/${job.id}`}
              className="p-4 rounded-xl bg-surface border border-border hover:border-accent/30 transition-all hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium truncate">
                      {job.title}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[job.status]}`}
                    >
                      {job.status}
                    </span>
                  </div>
                  {job.description && (
                    <p className="text-xs text-bone-dim line-clamp-1">
                      {job.description.slice(0, 120)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {job.budget && (
                    <span className="text-xs font-medium">{job.budget}</span>
                  )}
                  <span className="text-[10px] text-bone-dim/50">
                    {relativeTime(job.createdAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
