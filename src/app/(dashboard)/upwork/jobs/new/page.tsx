"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    upworkUrl: "",
    budget: "",
    budgetType: "fixed",
    description: "",
    clientInfo: "",
    proposalCount: "",
    connectsCost: "",
    deadline: "",
    notes: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      proposalCount: form.proposalCount ? Number(form.proposalCount) : null,
      connectsCost: form.connectsCost ? Number(form.connectsCost) : null,
    };
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const job = await res.json();
      router.push(`/upwork/jobs/${job.id}`);
    }
    setSaving(false);
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/upwork/jobs"
        className="inline-flex items-center gap-1.5 text-xs text-bone-dim hover:text-bone transition-colors mb-3"
      >
        <ArrowLeft size={12} />
        Jobs
      </Link>
      <h1 className="font-display text-2xl font-bold tracking-tight mb-6">
        Add Job
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <section className="p-5 rounded-xl bg-surface border border-border flex flex-col gap-3">
          <Field
            label="Title"
            value={form.title}
            onChange={(v) => update("title", v)}
            required
          />
          <Field
            label="Upwork URL"
            value={form.upworkUrl}
            onChange={(v) => update("upworkUrl", v)}
          />
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Budget"
              value={form.budget}
              onChange={(v) => update("budget", v)}
              placeholder="e.g. $200 or $30-50/hr"
            />
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                Budget Type
              </span>
              <select
                value={form.budgetType}
                onChange={(e) => update("budgetType", e.target.value)}
                className="rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone focus:border-accent focus:outline-none"
              >
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
              </select>
            </label>
            <Field
              label="Connects Cost"
              value={form.connectsCost}
              onChange={(v) => update("connectsCost", v)}
              type="number"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={6}
            placeholder="Paste the job description here..."
            className="rounded-lg border border-border bg-ink px-3 py-2 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none resize-y"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Client Info"
              value={form.clientInfo}
              onChange={(v) => update("clientInfo", v)}
              placeholder="e.g. Payment verified, 5 hires"
            />
            <Field
              label="Proposal Count"
              value={form.proposalCount}
              onChange={(v) => update("proposalCount", v)}
              type="number"
              placeholder="e.g. 5-10"
            />
          </div>
          <Field
            label="Deadline"
            value={form.deadline}
            onChange={(v) => update("deadline", v)}
            placeholder="e.g. 2 weeks"
          />
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            placeholder="Your notes..."
            className="rounded-lg border border-border bg-ink px-3 py-2 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none resize-y"
          />
        </section>

        <button
          type="submit"
          disabled={!form.title || saving}
          className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-ink-deep text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save Job
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none"
      />
    </label>
  );
}
