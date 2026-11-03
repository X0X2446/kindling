"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Logo } from "@/components/logo";

export type CatalogCard = {
  slug: string;
  title: string;
  blurb: string;
  level: string;
  difficulty: string;
  lessons: number;
  language: string;
  icon: string;
  iconFallback: string;
  tracks: string[];
};

export function Catalog({ cards, paths }: { cards: CatalogCard[]; paths: { slug: string; title: string }[] }) {
  const [query, setQuery] = useState("");
  const [path, setPath] = useState("all");
  const [level, setLevel] = useState("all");
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cards.filter((card) => {
      const pathOk = path === "all" || card.tracks.includes(path);
      const levelOk = level === "all" || card.level === level;
      const text = `${card.title} ${card.language} ${card.blurb}`.toLowerCase();
      return pathOk && levelOk && (!needle || text.includes(needle));
    });
  }, [cards, level, path, query]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try Rust, SQL, React…"
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by path">
          <Chip active={path === "all"} onClick={() => setPath("all")}>All paths</Chip>
          {paths.map((item) => (
            <Chip key={item.slug} active={path === item.slug} onClick={() => setPath(item.slug)}>{item.title}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by kind">
          {["all", "Language", "Framework", "Specialization"].map((item) => (
            <Chip key={item} active={level === item} onClick={() => setLevel(item)}>{item === "all" ? "Everything" : item}</Chip>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Nothing matches that search. Try another language or clear the path filter.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((card) => (
            <Link key={card.slug} href={`/courses/${card.slug}`} className="flex gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted">
              <Logo src={card.icon} fallback={card.iconFallback} alt="" className="size-12 shrink-0 rounded-xl" />
              <span className="min-w-0">
                <span className="block text-xs text-brass">{card.level} · {card.difficulty}</span>
                <span className="mt-1 block text-lg leading-6">{card.title}</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">{card.blurb}</span>
                <span className="mt-2 block text-xs text-muted-foreground">{card.lessons} lessons</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={active ? "shrink-0 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground" : "shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground"}
    >
      {children}
    </button>
  );
}
