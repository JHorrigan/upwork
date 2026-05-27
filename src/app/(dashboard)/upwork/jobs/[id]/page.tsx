"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  DollarSign,
  ExternalLink,
  Loader2,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  TrendingUp,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type { Job, ProposalTemplate, PortfolioProject, Milestone } from "@/lib/db/schema";

type RateGuidance = {
  suggestedRate: number;
  rateRange: { low: number; high: number };
  currency: string;
  upworkFee: number;
  youReceive: number;
  justification: string;
  rateIncrease: {
    recommended: boolean;
    frequency: string;
    percent: number | null;
    reasoning: string;
  };
  strategyPhase: string;
};

const STATUSES = [
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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState<Partial<Job>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [editingProposal, setEditingProposal] = useState(false);
  const [proposalDraft, setProposalDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [genError, setGenError] = useState("");

  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [paymentType, setPaymentType] = useState<string>("");

  const [rateGuidance, setRateGuidance] = useState<RateGuidance | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState("");
  const [bidRateInput, setBidRateInput] = useState("");
  const [bidRateSaving, setBidRateSaving] = useState(false);
  const [bidRateSaved, setBidRateSaved] = useState(false);

  const fetchJob = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`);
    if (res.ok) {
      const data = await res.json();
      setJob(data);
      if (data.bidRate != null) setBidRateInput(String(data.bidRate));
      if (data.paymentType) setPaymentType(data.paymentType);
      if (data.milestonesJson) setMilestones(JSON.parse(data.milestonesJson));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchJob();
    fetch("/api/proposal-templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []));
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.portfolioJson) setPortfolio(JSON.parse(d.portfolioJson));
      });
  }, [fetchJob]);

  async function updateStatus(status: string) {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setJob(await res.json());
  }

  function startEdit() {
    if (!job) return;
    setDraft({ ...job });
    setMode("edit");
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      setJob(await res.json());
      setMode("view");
      setDraft({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this job?")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    router.push("/upwork/jobs");
  }

  async function generateProposal() {
    setGenerating(true);
    setGenError("");
    const payload: Record<string, unknown> = { jobId: Number(id) };
    if (selectedTemplateId) payload.templateId = Number(selectedTemplateId);
    const res = await fetch("/api/proposals/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const saveRes = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalText: data.proposal }),
      });
      if (saveRes.ok) setJob(await saveRes.json());
    } else {
      const err = await res.json();
      setGenError(err.error ?? "Generation failed");
    }
    setGenerating(false);
  }

  function startEditProposal() {
    setProposalDraft(job?.proposalText ?? "");
    setEditingProposal(true);
  }

  async function saveProposal() {
    setSaving(true);
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalText: proposalDraft }),
    });
    if (res.ok) {
      setJob(await res.json());
      setEditingProposal(false);
    }
    setSaving(false);
  }

  async function copyProposal() {
    if (!job?.proposalText) return;
    await navigator.clipboard.writeText(job.proposalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function fetchRateGuidance() {
    setRateLoading(true);
    setRateError("");
    const res = await fetch("/api/rate-guidance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: Number(id) }),
    });
    if (res.ok) {
      const data = await res.json();
      setRateGuidance(data.guidance);
    } else {
      const err = await res.json();
      setRateError(err.error ?? "Failed to get rate guidance");
    }
    setRateLoading(false);
  }

  async function saveBidRate() {
    if (!bidRateInput) return;
    setBidRateSaving(true);
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bidRate: Number(bidRateInput) }),
    });
    if (res.ok) {
      setJob(await res.json());
      setBidRateSaved(true);
      setTimeout(() => setBidRateSaved(false), 2000);
    }
    setBidRateSaving(false);
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

  const val = (field: keyof Job) =>
    mode === "edit" ? (draft[field] ?? job[field]) : job[field];

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/upwork/jobs"
            className="inline-flex items-center gap-1.5 text-xs text-bone-dim hover:text-bone transition-colors mb-3"
          >
            <ArrowLeft size={12} />
            Jobs
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {job.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-6">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-accent">
              <Check size={14} /> Saved
            </span>
          )}
          {mode === "view" ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-bone transition-colors"
            >
              <Pencil size={12} />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setMode("view");
                  setDraft({});
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-bone transition-colors"
              >
                <X size={12} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Save size={12} />
                )}
                Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Job Details */}
        <div className="flex flex-col gap-4">
          {/* Status + Meta */}
          <section className="p-5 rounded-xl bg-surface border border-border">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                Status
              </span>
              <div className="flex gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                      job.status === s
                        ? STATUS_COLORS[s]
                        : "text-bone-dim/40 hover:text-bone-dim"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {mode === "edit" ? (
              <div className="flex flex-col gap-3">
                <Field
                  label="Title"
                  value={(val("title") as string) ?? ""}
                  onChange={(v) =>
                    setDraft((prev) => ({ ...prev, title: v }))
                  }
                />
                <Field
                  label="Upwork URL"
                  value={(val("upworkUrl") as string) ?? ""}
                  onChange={(v) =>
                    setDraft((prev) => ({ ...prev, upworkUrl: v }))
                  }
                />
                <div className="grid grid-cols-3 gap-2">
                  <Field
                    label="Budget"
                    value={(val("budget") as string) ?? ""}
                    onChange={(v) =>
                      setDraft((prev) => ({ ...prev, budget: v }))
                    }
                  />
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                      Type
                    </span>
                    <select
                      value={(val("budgetType") as string) ?? "fixed"}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          budgetType: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone focus:border-accent focus:outline-none"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </label>
                  <Field
                    label="Connects"
                    value={String(val("connectsCost") ?? "")}
                    onChange={(v) =>
                      setDraft((prev) => ({
                        ...prev,
                        connectsCost: v ? Number(v) : null,
                      }))
                    }
                    type="number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                      Experience Level
                    </span>
                    <select
                      value={(val("experienceLevel") as string) ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          experienceLevel: e.target.value || null,
                        }))
                      }
                      className="rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone focus:border-accent focus:outline-none"
                    >
                      <option value="">Not set</option>
                      <option value="Entry">Entry</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </label>
                  <Field
                    label="Category"
                    value={(val("category") as string) ?? ""}
                    onChange={(v) =>
                      setDraft((prev) => ({ ...prev, category: v || null }))
                    }
                  />
                </div>
                <Field
                  label="Skills (comma-separated)"
                  value={
                    (() => {
                      const v = val("skillsJson") as string | null;
                      if (!v) return "";
                      try { return JSON.parse(v).join(", "); } catch { return v; }
                    })()
                  }
                  onChange={(v) =>
                    setDraft((prev) => ({
                      ...prev,
                      skillsJson: v
                        ? JSON.stringify(v.split(",").map((s: string) => s.trim()).filter(Boolean))
                        : null,
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                      Weekly Hours
                    </span>
                    <select
                      value={(val("weeklyHours") as string) ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          weeklyHours: e.target.value || null,
                        }))
                      }
                      className="rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone focus:border-accent focus:outline-none"
                    >
                      <option value="">Not set</option>
                      <option value="Less than 30 hrs/week">Less than 30 hrs/week</option>
                      <option value="30+ hrs/week">30+ hrs/week</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                      Project Length
                    </span>
                    <select
                      value={(val("projectLength") as string) ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          projectLength: e.target.value || null,
                        }))
                      }
                      className="rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone focus:border-accent focus:outline-none"
                    >
                      <option value="">Not set</option>
                      <option value="Less than a month">Less than a month</option>
                      <option value="1 to 3 months">1 to 3 months</option>
                      <option value="3 to 6 months">3 to 6 months</option>
                      <option value="More than 6 months">More than 6 months</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="Boost Connects"
                    value={String(val("boostConnects") ?? "")}
                    onChange={(v) =>
                      setDraft((prev) => ({
                        ...prev,
                        boostConnects: v ? Number(v) : null,
                      }))
                    }
                    type="number"
                  />
                  <Field
                    label="Proposal Count"
                    value={String(val("proposalCount") ?? "")}
                    onChange={(v) =>
                      setDraft((prev) => ({
                        ...prev,
                        proposalCount: v ? Number(v) : null,
                      }))
                    }
                    type="number"
                  />
                </div>
                <Field
                  label="Client Info"
                  value={(val("clientInfo") as string) ?? ""}
                  onChange={(v) =>
                    setDraft((prev) => ({ ...prev, clientInfo: v }))
                  }
                />
                <Field
                  label="Deadline"
                  value={(val("deadline") as string) ?? ""}
                  onChange={(v) =>
                    setDraft((prev) => ({ ...prev, deadline: v }))
                  }
                />
                {portfolio.length > 0 && (
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                      Highlight Portfolio Project
                    </span>
                    <select
                      value={String(val("highlightedProjectIndex") ?? "")}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          highlightedProjectIndex: e.target.value
                            ? Number(e.target.value)
                            : null,
                        }))
                      }
                      className="rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone focus:border-accent focus:outline-none"
                    >
                      <option value="">Auto (best match)</option>
                      {portfolio.map((p, i) => (
                        <option key={i} value={i}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2">
                  {job.upworkUrl && (
                    <a
                      href={job.upworkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      <ExternalLink size={11} />
                      View on Upwork
                    </a>
                  )}
                  {job.experienceLevel && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      job.experienceLevel === "Expert"
                        ? "bg-amber-500/15 text-amber-400"
                        : job.experienceLevel === "Intermediate"
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-bone-dim/20 text-bone-dim"
                    }`}>
                      {job.experienceLevel}
                    </span>
                  )}
                  {job.category && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-raised text-bone-dim">
                      {job.category}
                    </span>
                  )}
                </div>

                {job.skillsJson && (() => {
                  const skills: string[] = JSON.parse(job.skillsJson);
                  return skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent/8 text-accent/80 border border-accent/10"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-bone-dim">
                  {job.budget && <span>Budget: {job.budget} ({job.budgetType})</span>}
                  {job.weeklyHours && <span>{job.weeklyHours}</span>}
                  {job.projectLength && <span>{job.projectLength}</span>}
                  {job.connectsCost != null && (
                    <span>{job.connectsCost} connects</span>
                  )}
                  {job.boostConnects != null && (
                    <span>+{job.boostConnects} boost</span>
                  )}
                  {job.proposalCount != null && (
                    <span>~{job.proposalCount} proposals</span>
                  )}
                  {job.clientInfo && <span>{job.clientInfo}</span>}
                  {job.deadline && <span>Deadline: {job.deadline}</span>}
                </div>

                {job.highlightedProjectIndex != null && portfolio[job.highlightedProjectIndex] && (
                  <div className="flex items-center gap-1.5 text-xs text-bone-dim/70">
                    <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                      Highlight:
                    </span>
                    {portfolio[job.highlightedProjectIndex].title}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Payment Structure */}
          <section className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-1.5">
              <DollarSign size={13} className="text-accent" />
              Payment Structure
            </h3>
            {mode === "edit" ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  {(["milestones", "project"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        const next = (val("paymentType") as string) === t ? "" : t;
                        setDraft((prev) => ({ ...prev, paymentType: next || null }));
                        setPaymentType(next);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        (val("paymentType") as string) === t
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : "border border-border text-bone-dim hover:text-bone"
                      }`}
                    >
                      {t === "milestones" ? "By Milestones" : "By Project"}
                    </button>
                  ))}
                </div>
                {(val("paymentType") as string) === "milestones" && (
                  <div className="flex flex-col gap-2">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <input
                          type="text"
                          placeholder="Description"
                          value={m.description}
                          onChange={(e) => {
                            const next = [...milestones];
                            next[i] = { ...next[i], description: e.target.value };
                            setMilestones(next);
                            setDraft((prev) => ({ ...prev, milestonesJson: JSON.stringify(next) }));
                          }}
                          className="flex-1 rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone placeholder:text-bone-dim/30 focus:border-accent focus:outline-none"
                        />
                        <input
                          type="date"
                          value={m.dueDate}
                          onChange={(e) => {
                            const next = [...milestones];
                            next[i] = { ...next[i], dueDate: e.target.value };
                            setMilestones(next);
                            setDraft((prev) => ({ ...prev, milestonesJson: JSON.stringify(next) }));
                          }}
                          className="w-[130px] rounded-lg border border-border bg-ink px-2 py-1.5 text-sm text-bone focus:border-accent focus:outline-none"
                        />
                        <div className="relative w-[100px]">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-bone-dim/50">$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={m.amount || ""}
                            onChange={(e) => {
                              const next = [...milestones];
                              next[i] = { ...next[i], amount: Number(e.target.value) || 0 };
                              setMilestones(next);
                              setDraft((prev) => ({ ...prev, milestonesJson: JSON.stringify(next) }));
                            }}
                            className="w-full rounded-lg border border-border bg-ink pl-6 pr-2 py-1.5 text-sm text-bone placeholder:text-bone-dim/30 focus:border-accent focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const next = milestones.filter((_, j) => j !== i);
                            setMilestones(next);
                            setDraft((prev) => ({ ...prev, milestonesJson: JSON.stringify(next) }));
                          }}
                          className="p-1.5 rounded-lg text-bone-dim/40 hover:text-red-400 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const next = [...milestones, { description: "", dueDate: "", amount: 0 }];
                        setMilestones(next);
                        setDraft((prev) => ({ ...prev, milestonesJson: JSON.stringify(next) }));
                      }}
                      className="self-start flex items-center gap-1.5 text-xs text-bone-dim hover:text-accent transition-colors"
                    >
                      <Plus size={12} />
                      Add Milestone
                    </button>
                    {milestones.length > 0 && (
                      <div className="flex justify-end text-xs text-bone-dim">
                        Total: ${milestones.reduce((sum, m) => sum + (m.amount || 0), 0).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm">
                {job.paymentType === "milestones" ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-bone-dim">By Milestones</span>
                    {(() => {
                      const ms: Milestone[] = job.milestonesJson ? JSON.parse(job.milestonesJson) : [];
                      return ms.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {ms.map((m, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg bg-ink px-3 py-2 border border-border-subtle">
                              <div className="flex flex-col">
                                <span className="text-xs text-bone">{m.description || "Untitled milestone"}</span>
                                {m.dueDate && (
                                  <span className="text-[10px] text-bone-dim/50">{m.dueDate}</span>
                                )}
                              </div>
                              <span className="text-xs font-medium text-bone">${m.amount.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-end text-xs text-accent font-medium pt-1">
                            Total: ${ms.reduce((sum, m) => sum + (m.amount || 0), 0).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-bone-dim/50">No milestones defined yet.</p>
                      );
                    })()}
                  </div>
                ) : job.paymentType === "project" ? (
                  <span className="text-xs text-bone-dim">By Project (paid on completion)</span>
                ) : (
                  <p className="text-xs text-bone-dim/50">Not set. Edit to choose milestones or project payment.</p>
                )}
              </div>
            )}
          </section>

          {/* Description */}
          <section className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="font-display text-sm font-semibold mb-2">
              Description
            </h3>
            {mode === "edit" ? (
              <textarea
                value={(val("description") as string) ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={8}
                className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none resize-y"
              />
            ) : (
              <p className="text-sm text-bone-dim leading-relaxed whitespace-pre-line">
                {job.description || "No description."}
              </p>
            )}
          </section>

          {/* Notes */}
          <section className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="font-display text-sm font-semibold mb-2">Notes</h3>
            {mode === "edit" ? (
              <textarea
                value={(val("notes") as string) ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none resize-y"
              />
            ) : (
              <p className="text-sm text-bone-dim leading-relaxed whitespace-pre-line">
                {job.notes || "No notes."}
              </p>
            )}
          </section>

          {/* Delete */}
          {mode === "view" && (
            <button
              onClick={handleDelete}
              className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={12} />
              Delete Job
            </button>
          )}
        </div>

        {/* Right Column: Rate Guidance + Proposal */}
        <div className="flex flex-col gap-4">
          {/* Rate Guidance */}
          <section className="p-5 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-semibold flex items-center gap-1.5">
                <DollarSign size={14} className="text-accent" />
                Rate Guidance
              </h3>
              {rateGuidance && (
                <button
                  onClick={fetchRateGuidance}
                  disabled={rateLoading}
                  className="flex items-center gap-1 text-xs text-bone-dim hover:text-bone transition-colors"
                >
                  {rateLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  Refresh
                </button>
              )}
            </div>

            {rateError && (
              <p className="text-xs text-red-400 mb-3">{rateError}</p>
            )}

            {rateGuidance ? (
              <div className="flex flex-col gap-4">
                {/* Rate recommendation */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight text-bone">
                        {rateGuidance.currency === "GBP" ? "£" : "$"}
                        {rateGuidance.suggestedRate}
                        <span className="text-sm font-normal text-bone-dim">/hr</span>
                      </span>
                      <span className="text-[10px] font-mono tracking-wider uppercase text-bone-dim/50">
                        recommended
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-bone-dim">
                      <span>
                        Range: {rateGuidance.currency === "GBP" ? "£" : "$"}
                        {rateGuidance.rateRange.low}--{rateGuidance.currency === "GBP" ? "£" : "$"}
                        {rateGuidance.rateRange.high}
                      </span>
                      <span className="text-bone-dim/30">|</span>
                      <span>
                        Fee: -{rateGuidance.currency === "GBP" ? "£" : "$"}
                        {rateGuidance.upworkFee.toFixed(2)}
                      </span>
                      <span className="text-bone-dim/30">|</span>
                      <span className="text-accent font-medium">
                        You receive: {rateGuidance.currency === "GBP" ? "£" : "$"}
                        {rateGuidance.youReceive.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strategy phase badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">
                    <TrendingUp size={10} />
                    {rateGuidance.strategyPhase}
                  </span>
                </div>

                {/* Justification */}
                <p className="text-xs text-bone-dim leading-relaxed">
                  {rateGuidance.justification}
                </p>

                {/* Rate increase recommendation */}
                {rateGuidance.rateIncrease.recommended && (
                  <div className="rounded-lg bg-ink p-3 border border-border-subtle">
                    <p className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50 mb-1">
                      Rate Increase Schedule
                    </p>
                    <p className="text-xs text-bone">
                      {rateGuidance.rateIncrease.percent}% every{" "}
                      {rateGuidance.rateIncrease.frequency}
                    </p>
                    <p className="text-xs text-bone-dim mt-1">
                      {rateGuidance.rateIncrease.reasoning}
                    </p>
                  </div>
                )}
                {rateGuidance.rateIncrease && !rateGuidance.rateIncrease.recommended && (
                  <div className="rounded-lg bg-ink p-3 border border-border-subtle">
                    <p className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50 mb-1">
                      Rate Increase Schedule
                    </p>
                    <p className="text-xs text-bone-dim">
                      {rateGuidance.rateIncrease.reasoning}
                    </p>
                  </div>
                )}

                {/* Bid rate input */}
                <div className="border-t border-border-subtle pt-3">
                  <p className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50 mb-2">
                    Your Bid Rate
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-[140px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-bone-dim/50">
                        {job.bidRateCurrency === "GBP" || (!job.bidRateCurrency && rateGuidance.currency === "GBP") ? "£" : "$"}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={bidRateInput}
                        onChange={(e) => setBidRateInput(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-border bg-ink pl-7 pr-10 py-1.5 text-sm text-bone placeholder:text-bone-dim/30 focus:border-accent focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-bone-dim/50">
                        /hr
                      </span>
                    </div>
                    <button
                      onClick={saveBidRate}
                      disabled={bidRateSaving || !bidRateInput}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {bidRateSaving ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : bidRateSaved ? (
                        <Check size={12} />
                      ) : (
                        <Save size={12} />
                      )}
                      {bidRateSaved ? "Saved" : "Save"}
                    </button>
                  </div>
                  {job.bidRate != null && (
                    <p className="text-xs text-bone-dim/50 mt-1.5">
                      After 10% fee: {job.bidRateCurrency === "GBP" ? "£" : "$"}
                      {(job.bidRate * 0.9).toFixed(2)}/hr
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-bone-dim/50 mb-4">
                  Get AI-powered rate advice based on the client&apos;s budget, your experience level, and Upwork fees.
                </p>
                <button
                  onClick={fetchRateGuidance}
                  disabled={rateLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {rateLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Zap size={14} />
                  )}
                  Get Rate Guidance
                </button>
              </div>
            )}
          </section>

          {/* Proposal */}
          <section className="p-5 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-semibold">Proposal</h3>
              {job.proposalText && !editingProposal && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyProposal}
                    className="flex items-center gap-1 text-xs text-bone-dim hover:text-bone transition-colors"
                  >
                    {copied ? (
                      <Check size={12} className="text-accent" />
                    ) : (
                      <ClipboardCopy size={12} />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={startEditProposal}
                    className="flex items-center gap-1 text-xs text-bone-dim hover:text-bone transition-colors"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                  {templates.length > 0 && (
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="rounded border border-border bg-ink px-2 py-0.5 text-[11px] text-bone-dim focus:border-accent focus:outline-none"
                    >
                      <option value="">No template</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={generateProposal}
                    disabled={generating}
                    className="flex items-center gap-1 text-xs text-bone-dim hover:text-bone transition-colors"
                  >
                    {generating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {editingProposal ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={proposalDraft}
                  onChange={(e) => setProposalDraft(e.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-bone focus:border-accent focus:outline-none resize-y"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingProposal(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-bone transition-colors"
                  >
                    <X size={12} />
                    Cancel
                  </button>
                  <button
                    onClick={saveProposal}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    Save
                  </button>
                </div>
              </div>
            ) : job.proposalText ? (
              <p className="text-sm text-bone-dim leading-relaxed whitespace-pre-line">
                {job.proposalText}
              </p>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-bone-dim/50 mb-4">
                  No proposal yet. Generate one using AI or write your own.
                </p>
                {templates.length > 0 && (
                  <div className="mb-4">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="rounded-lg border border-border bg-ink px-3 py-1.5 text-xs text-bone focus:border-accent focus:outline-none"
                    >
                      <option value="">No template (freeform)</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {genError && (
                  <p className="text-xs text-red-400 mb-3">{genError}</p>
                )}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={generateProposal}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {generating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Zap size={14} />
                    )}
                    Generate Proposal
                  </button>
                  <button
                    onClick={startEditProposal}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-bone transition-colors"
                  >
                    <Pencil size={14} />
                    Write Manually
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none"
      />
    </label>
  );
}
