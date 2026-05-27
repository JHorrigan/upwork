"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Rss,
  Star,
  X,
} from "lucide-react";
import type { FeedJob } from "@/lib/db/schema";

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

const STALE_MS = 24 * 60 * 60 * 1000;

function isStale(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() > STALE_MS;
}

export default function FeedPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<FeedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDismissed, setShowDismissed] = useState(false);
  const [promoting, setPromoting] = useState<number | null>(null);

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

  async function dismiss(id: number) {
    await fetch(`/api/feed-jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: 1 }),
    });
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  async function promote(id: number) {
    setPromoting(id);
    const res = await fetch(`/api/feed-jobs/${id}`, { method: "POST" });
    if (res.ok) {
      const newJob = await res.json();
      router.push(`/upwork/jobs/${newJob.id}`);
    } else if (res.status === 409) {
      const data = await res.json();
      router.push(`/upwork/jobs/${data.jobId}`);
    }
    setPromoting(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-bone-dim" />
      </div>
    );
  }

  const activeJobs = showDismissed ? jobs : jobs.filter((j) => !j.dismissed);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-8">
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
            Jobs discovered by the Upwork Job Scraper extension.
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

      {activeJobs.length === 0 ? (
        <div className="text-center py-16">
          <Rss size={32} className="mx-auto mb-3 text-bone-dim/30" />
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
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeJobs.map((job) => {
            const skills: string[] = job.skillsJson
              ? JSON.parse(job.skillsJson)
              : [];
            const isPromoted = !!job.promotedJobId;
            const stale = isStale(job.lastSeenAt);

            return (
              <section
                key={job.id}
                className={`p-5 rounded-xl bg-surface border transition-colors ${
                  isPromoted
                    ? "border-accent/20 opacity-70"
                    : job.dismissed
                      ? "border-border opacity-50"
                      : stale
                        ? "border-amber-500/20 opacity-60"
                        : "border-border hover:border-border/80"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-sm font-semibold truncate">
                        {job.title}
                      </h3>
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
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
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
                    {!isPromoted && !job.dismissed && (
                      <>
                        <button
                          onClick={() => dismiss(job.id)}
                          className="p-1.5 rounded-md text-bone-dim/50 hover:text-red-400 hover:bg-surface-raised transition-colors"
                          title="Dismiss"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => promote(job.id)}
                          disabled={promoting === job.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                        >
                          {promoting === job.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <ArrowRight size={12} />
                          )}
                          Track
                        </button>
                      </>
                    )}
                    {isPromoted && (
                      <Link
                        href={`/upwork/jobs/${job.promotedJobId}`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-accent/30 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
                      >
                        View
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>

                {job.description && (
                  <p className="text-xs text-bone-dim/60 leading-relaxed line-clamp-2 mt-2">
                    {job.description}
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded bg-surface-raised text-[10px] font-mono text-bone-dim/60"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
