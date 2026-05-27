"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  ExternalLink,
  Loader2,
  RotateCcw,
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

export default function FeedJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<FeedJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);

  const fetchJob = useCallback(async () => {
    const res = await fetch(`/api/feed-jobs/${id}`);
    if (res.ok) {
      setJob(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  async function promote() {
    setPromoting(true);
    const res = await fetch(`/api/feed-jobs/${id}`, { method: "POST" });
    if (res.ok) {
      const newJob = await res.json();
      router.push(`/upwork/jobs/${newJob.id}`);
    } else if (res.status === 409) {
      const data = await res.json();
      router.push(`/upwork/jobs/${data.jobId}`);
    }
    setPromoting(false);
  }

  async function dismiss() {
    await fetch(`/api/feed-jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: 1 }),
    });
    router.push("/upwork/feed");
  }

  async function restore() {
    await fetch(`/api/feed-jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: 0 }),
    });
    setJob((prev) => (prev ? { ...prev, dismissed: 0 } : prev));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-bone-dim" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-bone-dim">Job not found.</p>
      </div>
    );
  }

  const skills: string[] = job.skillsJson ? JSON.parse(job.skillsJson) : [];
  const isPromoted = !!job.promotedJobId;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/upwork/feed"
            className="inline-flex items-center gap-1.5 text-xs text-bone-dim hover:text-bone transition-colors mb-3"
          >
            <ArrowLeft size={12} />
            Job Feed
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {job.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-6">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-bone transition-colors"
            >
              <ExternalLink size={12} />
              View on Upwork
            </a>
          )}
          {!isPromoted && !job.dismissed && (
            <>
              <button
                onClick={dismiss}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-red-400 transition-colors"
              >
                <X size={12} />
                Dismiss
              </button>
              <button
                onClick={promote}
                disabled={promoting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {promoting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <ArrowRight size={12} />
                )}
                Track This Job
              </button>
            </>
          )}
          {!isPromoted && !!job.dismissed && (
            <button
              onClick={restore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/30 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              <RotateCcw size={12} />
              Restore to Feed
            </button>
          )}
          {isPromoted && (
            <Link
              href={`/upwork/jobs/${job.promotedJobId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all"
            >
              View Tracked Job
              <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Description */}
          <section className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="font-display text-sm font-semibold mb-3">
              Description
            </h3>
            <p className="text-sm text-bone-dim leading-relaxed whitespace-pre-line">
              {job.description || "No description available."}
            </p>
          </section>

          {/* Skills */}
          {skills.length > 0 && (
            <section className="p-5 rounded-xl bg-surface border border-border">
              <h3 className="font-display text-sm font-semibold mb-3">
                Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded bg-surface-raised text-[11px] font-mono text-bone-dim"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Job details */}
          <section className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="font-display text-sm font-semibold mb-3">
              Details
            </h3>
            <dl className="flex flex-col gap-2.5">
              {job.budget && (
                <div>
                  <dt className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                    Budget
                  </dt>
                  <dd className="text-sm text-bone">{job.budget}</dd>
                </div>
              )}
              {job.jobType && (
                <div>
                  <dt className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                    Type
                  </dt>
                  <dd className="text-sm text-bone">{job.jobType}</dd>
                </div>
              )}
              {job.experienceLevel && (
                <div>
                  <dt className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                    Experience Level
                  </dt>
                  <dd className="text-sm text-bone">{job.experienceLevel}</dd>
                </div>
              )}
              {job.proposals && (
                <div>
                  <dt className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                    Proposals
                  </dt>
                  <dd className="text-sm text-bone">{job.proposals}</dd>
                </div>
              )}
              {job.postedAt && (
                <div>
                  <dt className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                    Posted
                  </dt>
                  <dd className="text-sm text-bone flex items-center gap-1.5">
                    <Clock size={12} className="text-bone-dim/50" />
                    {timeAgo(job.postedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Client info */}
          <section className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="font-display text-sm font-semibold mb-3">
              Client
            </h3>
            <dl className="flex flex-col gap-2.5">
              {job.clientRating && (
                <div>
                  <dt className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                    Rating
                  </dt>
                  <dd className="text-sm text-bone flex items-center gap-1.5">
                    <Star size={12} className="text-amber-400" />
                    {job.clientRating}
                  </dd>
                </div>
              )}
              {job.clientTotalSpent && (
                <div>
                  <dt className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                    Total Spent
                  </dt>
                  <dd className="text-sm text-bone">{job.clientTotalSpent}</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                  Payment Verified
                </dt>
                <dd className="text-sm text-bone">
                  {job.paymentVerified ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          </section>

          {/* Meta */}
          <section className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="font-display text-sm font-semibold mb-3">
              Source
            </h3>
            <dl className="flex flex-col gap-2.5">
              {job.targetName && (
                <div>
                  <dt className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                    Search Target
                  </dt>
                  <dd className="text-sm text-bone">{job.targetName}</dd>
                </div>
              )}
              {job.lastSeenAt && (
                <div>
                  <dt className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                    Last Seen
                  </dt>
                  <dd className="text-sm text-bone">{timeAgo(job.lastSeenAt)}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
