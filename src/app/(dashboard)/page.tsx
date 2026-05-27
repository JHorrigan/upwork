import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="max-w-md text-center">
        <p className="text-xs font-mono font-medium tracking-widest uppercase text-bone-dim mb-4">
          Freelance Manager
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Win more work.
        </h1>
        <p className="mt-3 text-bone-dim leading-relaxed">
          Track proposals, draft pitches, and build your reputation across
          freelance platforms.
        </p>
        <Link
          href="/upwork"
          className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 rounded-lg bg-accent text-ink-deep text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Go to Upwork
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
