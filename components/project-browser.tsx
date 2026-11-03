"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProjectCard } from "@/lib/curriculum";

export function ProjectBrowser({
  projects,
  languages,
  paths,
}: {
  projects: ProjectCard[];
  languages: string[];
  paths: { slug: string; title: string }[];
}) {
  const [language, setLanguage] = useState("all");
  const [path, setPath] = useState("all");
  const [tier, setTier] = useState("all");
  const shown = useMemo(
    () => projects.filter((project) => {
      const languageOk = language === "all" || project.language === language;
      const pathOk = path === "all" || project.paths.includes(path);
      const tierOk = tier === "all" || project.tier === tier;
      return languageOk && pathOk && tierOk;
    }),
    [language, path, projects, tier],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3">
        <label className="flex max-w-xs flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Language</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          >
            <option value="all">All languages</option>
            {languages.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
          <FilterChip active={path === "all"} onClick={() => setPath("all")}>All paths</FilterChip>
          {paths.map((item) => (
            <FilterChip key={item.slug} active={path === item.slug} onClick={() => setPath(item.slug)}>{item.title}</FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "Beginner", "Intermediate", "Advanced"].map((item) => (
            <FilterChip key={item} active={tier === item} onClick={() => setTier(item)}>{item === "all" ? "All levels" : item}</FilterChip>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{shown.length} project{shown.length === 1 ? "" : "s"}</p>
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No project sits on that combination. Clear a filter and the list comes back.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((project) => (
            <Link key={project.id} href={project.href} className="rounded-2xl border border-border bg-card p-5 hover:bg-muted">
              <p className="text-xs text-brass">{project.language} · {project.tier}</p>
              <h2 className="mt-1 text-xl">{project.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.brief}</p>
              <p className="mt-3 text-xs text-muted-foreground">{project.course} · {project.steps} step{project.steps === 1 ? "" : "s"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={active ? "shrink-0 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground" : "shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"}
    >
      {children}
    </button>
  );
}
