"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutDashboard, Settings } from "lucide-react";

const platforms = [
  {
    name: "Upwork",
    href: "/upwork",
    icon: Briefcase,
    accent: "#14A800",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 h-screen shrink-0 bg-surface border-r border-border-subtle">
      <div className="px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
            <LayoutDashboard size={15} className="text-accent" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-bone group-hover:text-white transition-colors">
            Freelance
          </span>
        </Link>
      </div>

      <div className="px-3 mt-1">
        <p className="px-2 mb-2 text-[10px] font-mono font-medium tracking-[0.15em] uppercase text-bone-dim/50">
          Platforms
        </p>
        <nav className="flex flex-col gap-0.5">
          {platforms.map((platform) => {
            const isActive = pathname.startsWith(platform.href);
            return (
              <Link
                key={platform.href}
                href={platform.href}
                className={`nav-item ${isActive ? "nav-item-active" : ""}`}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isActive
                      ? `${platform.accent}20`
                      : "transparent",
                  }}
                >
                  <platform.icon
                    size={14}
                    style={{ color: isActive ? platform.accent : undefined }}
                  />
                </div>
                <span>{platform.name}</span>
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: platform.accent }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-border-subtle">
        <div className="px-3 py-3">
          <Link
            href="/settings"
            className={`nav-item ${pathname.startsWith("/settings") ? "nav-item-active" : ""}`}
          >
            <Settings size={14} />
            <span>Settings</span>
          </Link>
        </div>
        <div className="px-4 pb-4">
          <p className="text-[10px] font-mono text-bone-dim/40 tracking-wide">
            v0.1 -- Proposal Assistant
          </p>
        </div>
      </div>
    </aside>
  );
}
