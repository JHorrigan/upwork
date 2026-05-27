import { FileText, FolderOpen, TrendingUp, Zap } from "lucide-react";

const sections = [
  {
    title: "Proposals",
    description: "Draft, track, and manage your job proposals.",
    icon: FileText,
    status: "Coming soon",
  },
  {
    title: "Project Catalog",
    description: "Create and manage pre-defined service listings.",
    icon: FolderOpen,
    status: "Coming soon",
  },
  {
    title: "Strategy",
    description: "Win-rate tracking, connect budgets, and weekly goals.",
    icon: TrendingUp,
    status: "Coming soon",
  },
  {
    title: "Job Discovery",
    description: "Find and score matching jobs via RSS feeds.",
    icon: Zap,
    status: "Coming soon",
  },
];

export default function UpworkPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Upwork
        </h1>
        <p className="mt-1.5 text-sm text-bone-dim leading-relaxed">
          Your command center for winning freelance work on Upwork.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((section) => (
          <div
            key={section.title}
            className="group relative p-5 rounded-xl bg-surface border border-border hover:border-border/80 transition-all hover:shadow-card"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <section.icon size={18} className="text-accent" />
              </div>
              <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50 mt-1">
                {section.status}
              </span>
            </div>
            <h2 className="font-display text-sm font-semibold mb-1">
              {section.title}
            </h2>
            <p className="text-xs text-bone-dim leading-relaxed">
              {section.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
