"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { ProposalTemplate } from "@/lib/db/schema";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", content: "" });
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/proposal-templates");
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setForm({ name: "", content: "" });
  }

  function startEdit(t: ProposalTemplate) {
    setEditingId(t.id);
    setCreating(false);
    setForm({ name: t.name, content: t.content });
  }

  function cancelForm() {
    setCreating(false);
    setEditingId(null);
    setForm({ name: "", content: "" });
  }

  async function handleSave() {
    setSaving(true);
    if (creating) {
      await fetch("/api/proposal-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (editingId) {
      await fetch(`/api/proposal-templates/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    cancelForm();
    fetchTemplates();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/proposal-templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-bone-dim" />
      </div>
    );
  }

  const isEditing = creating || editingId !== null;

  return (
    <div className="p-8 max-w-3xl">
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
            Proposal Templates
          </h1>
          <p className="mt-1 text-sm text-bone-dim">
            Reusable starting points for AI-generated proposals.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all mt-6"
          >
            <Plus size={12} />
            New Template
          </button>
        )}
      </div>

      {isEditing && (
        <section className="p-5 rounded-xl bg-surface border border-accent/30 mb-4">
          <h2 className="font-display text-sm font-semibold mb-4">
            {creating ? "New Template" : "Edit Template"}
          </h2>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                Name
              </span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Web Development, API Integration"
                className="rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                Template Content
              </span>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Write your base proposal text here. The AI will use this as a structural and tonal reference when generating proposals for specific jobs."
                rows={10}
                className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none resize-y"
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={cancelForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-bone transition-colors"
              >
                <X size={12} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.content || saving}
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
        </section>
      )}

      {templates.length === 0 && !isEditing ? (
        <div className="text-center py-16">
          <FileText size={32} className="mx-auto mb-3 text-bone-dim/30" />
          <p className="text-sm text-bone-dim/50 mb-4">
            No templates yet. Create one to give the AI a starting point for proposals.
          </p>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all"
          >
            <Plus size={12} />
            Create First Template
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <section
              key={t.id}
              className={`p-5 rounded-xl bg-surface border transition-colors ${
                editingId === t.id ? "border-accent/30" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-sm font-semibold">{t.name}</h3>
                {editingId !== t.id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(t)}
                      className="flex items-center gap-1 text-xs text-bone-dim hover:text-bone transition-colors"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
              {editingId !== t.id && (
                <p className="text-sm text-bone-dim leading-relaxed whitespace-pre-line line-clamp-4">
                  {t.content}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
