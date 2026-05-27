"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Check,
  ExternalLink,
  GraduationCap,
  Globe,
  Loader2,
  MapPin,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  Clock,
  DollarSign,
} from "lucide-react";
import type {
  Profile,
  PortfolioProject,
  Employment,
  Education,
  Language,
} from "@/lib/db/schema";

function parseJson<T>(raw: string | null): T[] {
  if (!raw) return [];
  return JSON.parse(raw) as T[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<Partial<Profile>>({});

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function startEdit() {
    if (!profile) return;
    setDraft({ ...profile });
    setMode("edit");
  }

  function cancelEdit() {
    setDraft({});
    setMode("view");
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setMode("view");
      setDraft({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function updateDraft(field: keyof Profile, value: string | number | null) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-bone-dim" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-bone-dim">No profile found.</p>
        <p className="text-xs text-bone-dim/50 font-mono">
          Run: pnpm db:push && pnpm db:seed
        </p>
      </div>
    );
  }

  const skills: string[] = parseJson(
    mode === "edit" ? (draft.skillsJson ?? profile.skillsJson) : profile.skillsJson,
  );
  const portfolio: PortfolioProject[] = parseJson(
    mode === "edit" ? (draft.portfolioJson ?? profile.portfolioJson) : profile.portfolioJson,
  );
  const employment: Employment[] = parseJson(
    mode === "edit" ? (draft.employmentJson ?? profile.employmentJson) : profile.employmentJson,
  );
  const education: Education[] = parseJson(
    mode === "edit" ? (draft.educationJson ?? profile.educationJson) : profile.educationJson,
  );
  const languages: Language[] = parseJson(
    mode === "edit" ? (draft.languagesJson ?? profile.languagesJson) : profile.languagesJson,
  );

  const val = (field: keyof Profile) =>
    mode === "edit" ? (draft[field] ?? profile[field]) : profile[field];

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
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
            Profile
          </h1>
          <p className="mt-1 text-sm text-bone-dim">
            Your freelancer profile. Feeds into proposal drafting.
          </p>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-bone hover:border-bone-dim/30 transition-colors"
            >
              <Pencil size={12} />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={cancelEdit}
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

      <div className="flex flex-col gap-4">
        {/* Identity */}
        <section className="p-5 rounded-xl bg-surface border border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {mode === "edit" ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Display Name"
                      value={val("name") as string}
                      onChange={(v) => updateDraft("name", v)}
                    />
                    <Field
                      label="Full Name"
                      value={val("fullName") as string}
                      onChange={(v) => updateDraft("fullName", v)}
                    />
                  </div>
                  <Field
                    label="Professional Title"
                    value={val("title") as string}
                    onChange={(v) => updateDraft("title", v)}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Field
                      label="Hourly Rate"
                      value={String(val("hourlyRate") ?? "")}
                      onChange={(v) =>
                        updateDraft("hourlyRate", v ? parseFloat(v) : null)
                      }
                      type="number"
                    />
                    <Field
                      label="Currency"
                      value={val("rateCurrency") as string}
                      onChange={(v) => updateDraft("rateCurrency", v)}
                    />
                    <Field
                      label="Availability"
                      value={val("availability") as string}
                      onChange={(v) => updateDraft("availability", v)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Location"
                      value={val("location") as string}
                      onChange={(v) => updateDraft("location", v)}
                    />
                    <Field
                      label="Timezone"
                      value={val("timezone") as string}
                      onChange={(v) => updateDraft("timezone", v)}
                    />
                  </div>
                  <Field
                    label="Upwork URL"
                    value={val("upworkUrl") as string}
                    onChange={(v) => updateDraft("upworkUrl", v)}
                  />
                </div>
              ) : (
                <>
                  <h2 className="font-display text-lg font-semibold">
                    {profile.fullName ?? profile.name}
                  </h2>
                  <p className="text-sm text-accent font-medium mt-0.5">
                    {profile.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-bone-dim">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {profile.location}
                      </span>
                    )}
                    {profile.hourlyRate && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {profile.rateCurrency === "GBP" ? "£" : "$"}
                        {profile.hourlyRate}/hr
                      </span>
                    )}
                    {profile.availability && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {profile.availability}
                      </span>
                    )}
                    {profile.timezone && (
                      <span className="flex items-center gap-1">
                        <Globe size={12} />
                        {profile.timezone}
                      </span>
                    )}
                  </div>
                  {profile.upworkUrl && (
                    <a
                      href={profile.upworkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-xs text-accent hover:underline"
                    >
                      <ExternalLink size={11} />
                      Upwork Profile
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="p-5 rounded-xl bg-surface border border-border">
          <h3 className="font-display text-sm font-semibold mb-3">Overview</h3>
          {mode === "edit" ? (
            <textarea
              value={(val("overview") as string) ?? ""}
              onChange={(e) => updateDraft("overview", e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none resize-y"
            />
          ) : (
            <p className="text-sm text-bone-dim leading-relaxed whitespace-pre-line">
              {profile.overview}
            </p>
          )}
        </section>

        {/* Skills */}
        <section className="p-5 rounded-xl bg-surface border border-border">
          <h3 className="font-display text-sm font-semibold mb-3">Skills</h3>
          {mode === "edit" ? (
            <SkillsEditor
              skills={skills}
              onChange={(updated) =>
                updateDraft("skillsJson", JSON.stringify(updated))
              }
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-full bg-accent/10 text-xs font-medium text-accent"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Portfolio */}
        <section className="p-5 rounded-xl bg-surface border border-border">
          <h3 className="font-display text-sm font-semibold mb-3">
            Portfolio
          </h3>
          {mode === "edit" ? (
            <ListEditor
              items={portfolio}
              onChange={(updated) =>
                updateDraft("portfolioJson", JSON.stringify(updated))
              }
              renderItem={(item, i, update, remove) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-border-subtle">
                  <div className="flex items-start justify-between">
                    <Field
                      label="Title"
                      value={item.title}
                      onChange={(v) => update({ ...item, title: v })}
                    />
                    <button
                      onClick={remove}
                      className="p-1 text-bone-dim hover:text-red-400 transition-colors ml-2 mt-5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      update({ ...item, description: e.target.value })
                    }
                    rows={2}
                    placeholder="Description"
                    className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none resize-y"
                  />
                  <Field
                    label="Technologies (comma-separated)"
                    value={(item.technologies ?? []).join(", ")}
                    onChange={(v) =>
                      update({
                        ...item,
                        technologies: v
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              )}
              newItem={() => ({
                title: "",
                description: "",
                technologies: [],
              })}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {portfolio.map((project) => (
                <div key={project.title} className="p-3 rounded-lg border border-border-subtle">
                  <h4 className="text-sm font-medium">{project.title}</h4>
                  <p className="text-xs text-bone-dim mt-1 leading-relaxed">
                    {project.description}
                  </p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded bg-surface-raised text-[10px] font-mono text-bone-dim"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Employment */}
        <section className="p-5 rounded-xl bg-surface border border-border">
          <h3 className="font-display text-sm font-semibold mb-3">
            <Briefcase size={14} className="inline mr-1.5 -mt-0.5" />
            Experience
          </h3>
          {mode === "edit" ? (
            <ListEditor
              items={employment}
              onChange={(updated) =>
                updateDraft("employmentJson", JSON.stringify(updated))
              }
              renderItem={(item, i, update, remove) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-border-subtle">
                  <div className="flex items-start justify-between">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <Field
                        label="Title"
                        value={item.title}
                        onChange={(v) => update({ ...item, title: v })}
                      />
                      <Field
                        label="Company"
                        value={item.company}
                        onChange={(v) => update({ ...item, company: v })}
                      />
                    </div>
                    <button
                      onClick={remove}
                      className="p-1 text-bone-dim hover:text-red-400 transition-colors ml-2 mt-5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field
                      label="Start"
                      value={item.startDate}
                      onChange={(v) => update({ ...item, startDate: v })}
                    />
                    <Field
                      label="End"
                      value={item.endDate ?? ""}
                      onChange={(v) => update({ ...item, endDate: v || undefined })}
                    />
                  </div>
                  <textarea
                    value={item.description ?? ""}
                    onChange={(e) =>
                      update({ ...item, description: e.target.value })
                    }
                    rows={2}
                    placeholder="Description"
                    className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none resize-y"
                  />
                </div>
              )}
              newItem={(): Employment => ({
                title: "",
                company: "",
                startDate: "",
              })}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {employment.map((job, i) => (
                <div key={i} className="p-3 rounded-lg border border-border-subtle">
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-sm font-medium">{job.title}</h4>
                    <span className="text-[10px] font-mono text-bone-dim/50 shrink-0 ml-3">
                      {job.startDate} - {job.endDate ?? "Present"}
                    </span>
                  </div>
                  <p className="text-xs text-accent/80 font-medium mt-0.5">
                    {job.company}
                  </p>
                  {job.description && (
                    <p className="text-xs text-bone-dim mt-1.5 leading-relaxed">
                      {job.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Education & Languages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="font-display text-sm font-semibold mb-3">
              <GraduationCap size={14} className="inline mr-1.5 -mt-0.5" />
              Education
            </h3>
            <div className="flex flex-col gap-2">
              {education.map((ed, i) => (
                <div key={i}>
                  <p className="text-sm font-medium">{ed.degree}</p>
                  <p className="text-xs text-bone-dim">
                    {ed.institution}
                    {ed.year && (
                      <span className="text-bone-dim/50"> -- {ed.year}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="font-display text-sm font-semibold mb-3">
              <Globe size={14} className="inline mr-1.5 -mt-0.5" />
              Languages
            </h3>
            <div className="flex flex-col gap-2">
              {languages.map((lang, i) => (
                <div key={i}>
                  <p className="text-sm font-medium">{lang.language}</p>
                  <p className="text-xs text-bone-dim">{lang.proficiency}</p>
                </div>
              ))}
            </div>
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

function SkillsEditor({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addSkill() {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
      setInput("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-xs font-medium text-accent"
          >
            {skill}
            <button
              onClick={() => onChange(skills.filter((s) => s !== skill))}
              className="hover:text-red-400 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
          placeholder="Add skill..."
          className="flex-1 rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none"
        />
        <button
          onClick={addSkill}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-bone transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
    </div>
  );
}

function ListEditor<T>({
  items,
  onChange,
  renderItem,
  newItem,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (
    item: T,
    index: number,
    update: (item: T) => void,
    remove: () => void,
  ) => React.ReactNode;
  newItem: () => T;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) =>
        renderItem(
          item,
          i,
          (updated) => {
            const copy = [...items];
            copy[i] = updated;
            onChange(copy);
          },
          () => onChange(items.filter((_, j) => j !== i)),
        ),
      )}
      <button
        onClick={() => onChange([...items, newItem()])}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs font-medium text-bone-dim hover:text-bone hover:border-bone-dim/30 transition-colors"
      >
        <Plus size={12} />
        Add Item
      </button>
    </div>
  );
}
