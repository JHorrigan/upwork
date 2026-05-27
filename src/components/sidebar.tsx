"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Mail,
  Rows3,
  Settings,
  User,
} from "lucide-react";

interface SubItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface Platform {
  name: string;
  href: string;
  icon: React.ComponentType<{
    size?: number;
    style?: React.CSSProperties;
    className?: string;
  }>;
  accent: string;
  subItems: SubItem[];
}

const platforms: Platform[] = [
  {
    name: "Upwork",
    href: "/upwork",
    icon: Briefcase,
    accent: "#14A800",
    subItems: [
      { name: "Profile", href: "/upwork/profile", icon: User },
      { name: "Job Feed", href: "/upwork/feed", icon: Mail },
      { name: "Jobs", href: "/upwork/jobs", icon: FileText },
      { name: "Templates", href: "/upwork/templates", icon: Rows3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const p of platforms) {
      if (pathname.startsWith(p.href)) {
        initial[p.name] = true;
      }
    }
    return initial;
  });

  function togglePlatform(name: string) {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  }

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
        <Link
          href="/"
          className={`nav-item ${pathname === "/" ? "nav-item-active" : ""}`}
        >
          <LayoutDashboard size={14} />
          <span>Dashboard</span>
        </Link>
      </div>

      <div className="px-3 mt-4">
        <p className="px-2 mb-2 text-[10px] font-mono font-medium tracking-[0.15em] uppercase text-bone-dim/50">
          Platforms
        </p>
        <nav className="flex flex-col gap-0.5">
          {platforms.map((platform) => {
            const isPlatformActive = pathname.startsWith(platform.href);
            const isExpanded = expanded[platform.name] || isPlatformActive;

            return (
              <div key={platform.name}>
                <button
                  onClick={() => togglePlatform(platform.name)}
                  className={`nav-item w-full ${isPlatformActive ? "nav-item-active" : ""}`}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isPlatformActive
                        ? `${platform.accent}20`
                        : "transparent",
                    }}
                  >
                    <platform.icon
                      size={14}
                      style={{
                        color: isPlatformActive ? platform.accent : undefined,
                      }}
                    />
                  </div>
                  <span className="flex-1 text-left">{platform.name}</span>
                  <ChevronDown
                    size={12}
                    className={`text-bone-dim/40 transition-transform duration-200 ${
                      isExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-border-subtle pl-2">
                    <Link
                      href={platform.href}
                      className={`nav-item text-xs py-1.5 ${
                        pathname === platform.href ? "nav-item-active" : ""
                      }`}
                    >
                      <span
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            pathname === platform.href
                              ? platform.accent
                              : "transparent",
                        }}
                      />
                      <span>Overview</span>
                    </Link>
                    {platform.subItems.map((item) => {
                      const isSubActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`nav-item text-xs py-1.5 ${
                            isSubActive ? "nav-item-active" : ""
                          }`}
                        >
                          <span
                            className="w-1 h-1 rounded-full shrink-0"
                            style={{
                              backgroundColor: isSubActive
                                ? platform.accent
                                : "transparent",
                            }}
                          />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
