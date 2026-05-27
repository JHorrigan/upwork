"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Briefcase,
  FileText,
  FolderOpen,
  Mail,
  TrendingUp,
  Zap,
} from "lucide-react";

type Job = {
  id: number;
  title: string;
  status: string;
  budget?: string;
  bidRate?: number;
  bidRateCurrency?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: string;
  createdAt: string;
};

type FeedJob = {
  id: number;
  title: string;
  url?: string;
  budget?: string;
  postedAt?: string;
};

function jobValue(job: Job): number {
  if (job.bidRate) return job.bidRate;
  if (job.budgetMax) return job.budgetMax;
  if (job.budgetMin) return job.budgetMin;
  return 0;
}

function formatCurrency(amount: number): string {
  if (amount === 0) return "$0";
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const statusOrder = [
  "interview",
  "won",
  "submitted",
  "viewed",
  "draft",
  "completed",
  "lost",
];

const comingSoon = [
  {
    title: "Project Catalog",
    description: "Create and manage pre-defined service listings.",
    icon: FolderOpen,
    version: "v0.2",
  },
  {
    title: "Strategy",
    description: "Win-rate tracking, connect budgets, and weekly goals.",
    icon: TrendingUp,
    version: "v0.3",
  },
  {
    title: "Job Discovery+",
    description: "AI scoring, quick-apply workflow, and feed analytics.",
    icon: Zap,
    version: "v0.4",
  },
];

export default function UpworkPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [feedJobs, setFeedJobs] = useState<FeedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/feed-jobs").then((r) => r.json()),
    ]).then(([jobsData, feedData]) => {
      setJobs(jobsData.jobs ?? []);
      setFeedJobs(feedData.jobs ?? []);
      setLoading(false);
    });
  }, []);

  const submitted = jobs.filter((j) => j.status === "submitted").length;
  const inProgress = jobs.filter((j) =>
    ["interview", "won"].includes(j.status),
  ).length;
  const won = jobs.filter((j) => j.status === "won").length;
  const completed = jobs.filter((j) => j.status === "completed").length;
  const total = jobs.length;
  const decidedCount = submitted + won + completed;
  const winRate =
    decidedCount > 0
      ? Math.round(((won + completed) / decidedCount) * 100)
      : 0;

  const earned = jobs
    .filter((j) => j.status === "completed")
    .reduce((sum, j) => sum + jobValue(j), 0);
  const pipeline = jobs
    .filter((j) => j.status === "won")
    .reduce((sum, j) => sum + jobValue(j), 0);

  const statusCounts: Record<string, number> = {};
  for (const job of jobs) {
    statusCounts[job.status] = (statusCounts[job.status] ?? 0) + 1;
  }

  const recentFeed = feedJobs.slice(0, 8);
  const recentJobs = jobs.slice(0, 5);

  const quickActions = [
    { label: "Browse Feed", href: "/upwork/feed", icon: Mail },
    { label: "Templates", href: "/upwork/templates", icon: FileText },
  ];

  const stats = [
    { label: "Tracked", value: String(total), icon: Briefcase },
    { label: "Proposals", value: String(submitted), icon: FileText },
    { label: "Active", value: String(inProgress), icon: TrendingUp },
    { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp },
    { label: "Earned", value: formatCurrency(earned), icon: Banknote },
    { label: "Pipeline", value: formatCurrency(pipeline), icon: Banknote },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-bone-dim">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Upwork
        </h1>
        <p className="mt-1.5 text-sm text-bone-dim leading-relaxed">
          Your command center for winning freelance work on Upwork.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-surface border border-border-subtle"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className="text-bone-dim/60" />
              <p className="text-[11px] font-mono tracking-wide uppercase text-bone-dim/60">
                {stat.label}
              </p>
            </div>
            <p className="text-2xl font-display font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border-subtle text-sm font-medium hover:border-accent/30 hover:text-white transition-all"
          >
            <action.icon size={14} />
            {action.label}
          </Link>
        ))}
      </div>

      {statusOrder.some((s) => statusCounts[s]) && (
        <div className="mb-8">
          <h2 className="font-display text-sm font-semibold mb-3">
            Jobs by Status
          </h2>
          <div className="flex flex-wrap gap-2">
            {statusOrder
              .filter((s) => statusCounts[s])
              .map((status) => (
                <Link
                  key={status}
                  href={`/upwork/jobs?status=${status}`}
                  className="px-3 py-2 rounded-lg bg-surface border border-border-subtle hover:border-border transition-colors"
                >
                  <span className="text-xs font-mono uppercase tracking-wider text-bone-dim">
                    {status}
                  </span>
                  <span className="ml-2 text-sm font-display font-bold">
                    {statusCounts[status]}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-semibold">
              Recent Feed Jobs
            </h2>
            <Link
              href="/upwork/feed"
              className="text-xs text-bone-dim hover:text-bone transition-colors flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentFeed.length === 0 ? (
            <div className="p-6 rounded-xl bg-surface border border-border-subtle text-center">
              <Mail size={20} className="mx-auto mb-2 text-bone-dim/40" />
              <p className="text-xs text-bone-dim">
                No feed jobs yet. Jobs appear here from the browser extension.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {recentFeed.map((job) => (
                <Link
                  key={job.id}
                  href={`/upwork/feed/${job.id}`}
                  className="p-3 rounded-lg bg-surface border border-border-subtle hover:border-border transition-colors group"
                >
                  <p className="text-sm font-medium truncate group-hover:text-white transition-colors">
                    {job.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {job.budget && (
                      <span className="text-xs text-bone-dim">
                        {job.budget}
                      </span>
                    )}
                    {job.postedAt && (
                      <span className="text-xs text-bone-dim/50">
                        {new Date(job.postedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-semibold">
              Tracked Jobs
            </h2>
            <Link
              href="/upwork/jobs"
              className="text-xs text-bone-dim hover:text-bone transition-colors flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="p-6 rounded-xl bg-surface border border-border-subtle text-center">
              <FileText size={20} className="mx-auto mb-2 text-bone-dim/40" />
              <p className="text-xs text-bone-dim">
                No tracked jobs yet. Start tracking jobs from the feed.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/upwork/jobs/${job.id}`}
                  className="p-3 rounded-lg bg-surface border border-border-subtle hover:border-border transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate group-hover:text-white transition-colors">
                      {job.title}
                    </p>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {job.budget && (
                      <span className="text-xs text-bone-dim">
                        {job.budget}
                      </span>
                    )}
                    <span className="text-xs text-bone-dim/50">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-display text-sm font-semibold mb-3 text-bone-dim/60">
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {comingSoon.map((item) => (
            <div
              key={item.title}
              className="p-4 rounded-xl bg-surface border border-border-subtle/50"
            >
              <div className="flex items-center justify-between mb-2">
                <item.icon size={16} className="text-bone-dim/30" />
                <span className="text-[10px] font-mono tracking-wider uppercase text-bone-dim/30">
                  {item.version}
                </span>
              </div>
              <h3 className="text-sm font-medium text-bone-dim/60">
                {item.title}
              </h3>
              <p className="text-xs text-bone-dim/30 mt-0.5">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-bone-dim/10 text-bone-dim",
    submitted: "bg-blue-500/15 text-blue-400",
    viewed: "bg-purple-500/15 text-purple-400",
    interview: "bg-amber-500/15 text-amber-400",
    won: "bg-accent/15 text-accent",
    completed: "bg-accent/15 text-accent",
    lost: "bg-red-500/15 text-red-400",
  };

  return (
    <span
      className={`text-[10px] font-mono font-medium tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0 ${colors[status] ?? colors.draft}`}
    >
      {status}
    </span>
  );
}
