"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { rankFor } from "@/lib/progress";
import { useProgress } from "@/components/progress-provider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/paths", label: "Paths" },
  { href: "/projects", label: "Projects" },
  { href: "/progress", label: "Progress" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { ready, state, toggleSound } = useProgress();
  const rank = rankFor(state.xp);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg tracking-tight">
          <span className="inline-block size-2.5 rounded-full bg-flame shadow-[0_0_12px_var(--flame)]" aria-hidden />
          Kindling
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-2.5 py-1 text-muted-foreground hover:text-foreground",
                pathname.startsWith(link.href) && "bg-muted text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={toggleSound}
            className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
            aria-pressed={state.sound}
          >
            {state.sound ? "Sound on" : "Sound off"}
          </button>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1 sm:flex">
            <span className="text-brass">{rank.name}</span>
            <span className="text-muted-foreground">{state.xp} XP</span>
            {ready && state.streak > 0 ? <span>{state.streak} day streak</span> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
