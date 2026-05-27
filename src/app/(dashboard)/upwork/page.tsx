import Link from "next/link";
import { Bell, FileText, FolderOpen, Mail, TrendingUp, User, Zap } from "lucide-react";

const sections = [
  {
    title: "Profile",
    description: "Your skills, experience, and positioning. Feeds into proposal drafting.",
    icon: User,
    status: "v0.1",
    href: "/upwork/profile",
  },
  {
    title: "Job Feed",
    description: "Jobs from Upwork email alerts, parsed and surfaced newest first.",
    icon: Mail,
    status: "v0.1",
    href: null,
  },
  {
    title: "Slack Alerts",
    description: "Push notifications for new matching jobs, straight to Slack.",
    icon: Bell,
    status: "v0.1",
    href: null,
  },
  {
    title: "Jobs & Proposals",
    description: "Track jobs through the pipeline. AI-draft proposals using your profile.",
    icon: FileText,
    status: "v0.1",
    href: "/upwork/jobs",
  },
  {
    title: "Project Catalog",
    description: "Create and manage pre-defined service listings.",
    icon: FolderOpen,
    status: "v0.2",
    href: null,
  },
  {
    title: "Strategy",
    description: "Win-rate tracking, connect budgets, and weekly goals.",
    icon: TrendingUp,
    status: "v0.3",
    href: null,
  },
  {
    title: "Job Discovery+",
    description: "AI scoring, quick-apply workflow, and feed analytics.",
    icon: Zap,
    status: "v0.4",
    href: null,
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
        {sections.map((section) => {
          const card = (
            <div
              className={`group relative p-5 rounded-xl bg-surface border border-border transition-all hover:shadow-card ${
                section.href
                  ? "hover:border-accent/30 cursor-pointer"
                  : "hover:border-border/80"
              }`}
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
          );

          if (section.href) {
            return (
              <Link key={section.title} href={section.href}>
                {card}
              </Link>
            );
          }
          return <div key={section.title}>{card}</div>;
        })}
      </div>
    </div>
  );
}
