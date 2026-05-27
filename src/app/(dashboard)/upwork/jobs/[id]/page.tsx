"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  ExternalLink,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type { Job, ProposalTemplate } from "@/lib/db/schema";

const STATUSES = [
  "draft",
  "submitted",
  "viewed",
  "interview",
  "won",
  "lost",
] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-bone-dim/20 text-bone-dim",
  submitted: "bg-blue-500/15 text-blue-400",
  viewed: "bg-purple-500/15 text-purple-400",
  interview: "bg-amber-500/15 text-amber-400",
  won: "bg-accent/15 text-accent",
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

  const fetchJob = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`);
    if (res.ok) {
      const data = await res.json();
      setJob(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchJob();
    fetch("/api/proposal-templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []));
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
              </div>
            ) : (
              <div className="flex flex-col gap-2 text-sm">
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
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-bone-dim">
                  {job.budget && <span>Budget: {job.budget} ({job.budgetType})</span>}
                  {job.connectsCost && (
                    <span>{job.connectsCost} connects</span>
                  )}
                  {job.clientInfo && <span>{job.clientInfo}</span>}
                  {job.deadline && <span>Deadline: {job.deadline}</span>}
                </div>
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

        {/* Proposal Section */}
        <div className="flex flex-col gap-4">
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
