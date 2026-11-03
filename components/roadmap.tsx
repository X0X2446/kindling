"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { useProgress } from "@/components/progress-provider";
import { lessonKey } from "@/lib/keys";
import { cn } from "@/lib/utils";

export type RoadNode = {
  slug: string;
  title: string;
  xp: number;
  project: boolean;
  checkpoint: boolean;
};

export type RoadUnit = { title: string; items: RoadNode[] };

export function CourseRoadmap({
  course,
  title,
  language,
  level,
  blurb,
  icon,
  iconFallback,
  units,
}: {
  course: string;
  title: string;
  language: string;
  level: string;
  blurb: string;
  icon: string;
  iconFallback: string;
  units: RoadUnit[];
}) {
  const { state } = useProgress();
  const flat = units.flatMap((unit) => unit.items);
  const done = flat.filter((item) => state.completed[lessonKey(course, item.slug)]).length;
  const earned = flat.reduce((sum, item) => sum + (state.completed[lessonKey(course, item.slug)]?.xp ?? 0), 0);
  const percent = flat.length ? Math.round((done / flat.length) * 100) : 0;
  const finished = flat.length > 0 && done === flat.length;
  let seen = 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <Logo src={icon} fallback={iconFallback} alt="" className="size-20 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-[0.16em] text-brass uppercase">{level} · {language}</p>
          <h1 className="mt-1 text-4xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{blurb}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-40 sm:grid-cols-1">
          <Stat label="Progress" value={`${percent}%`} />
          <Stat label="XP earned" value={String(earned)} />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-xl flex-col">
        {units.map((unit) => (
          <section key={unit.title} className="flex flex-col">
            <h2 className="px-2 py-3 text-center text-sm tracking-[0.14em] text-brass uppercase">{unit.title}</h2>
            <ol className="flex flex-col">
              {unit.items.map((item) => {
                const index = seen++;
                const key = lessonKey(course, item.slug);
                const complete = Boolean(state.completed[key]);
                const previous = index === 0 ? null : flat[index - 1];
                const unlocked = index === 0 || Boolean(previous && state.completed[lessonKey(course, previous.slug)]);
                const current = unlocked && !complete;
                const side = index % 2 === 1;
                return (
                  <li key={item.slug} className="relative py-2">
                    <span className="absolute top-0 bottom-0 left-5 w-px bg-border md:left-1/2" aria-hidden />
                    <div className={cn("relative z-10 ml-12 md:ml-0 md:w-[calc(50%-1.25rem)]", side && "md:ml-[calc(50%+1.25rem)]")}>
                      {unlocked ? (
                        <Link href={`/learn/${course}/${item.slug}`} className={nodeClass(complete, current, item)}>
                          <NodeBody item={item} complete={complete} current={current} />
                        </Link>
                      ) : (
                        <div className={nodeClass(false, false, item)} aria-disabled="true">
                          <NodeBody item={item} complete={false} current={false} locked />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        <div className="relative mt-2 flex justify-center py-6">
          <span className="absolute top-0 bottom-6 left-5 w-px bg-border md:left-1/2" aria-hidden />
          <div className={cn("relative z-10 ml-12 rounded-full border px-4 py-3 text-center md:ml-0", finished ? "border-brass bg-card kindling-pop" : "border-border bg-card/70 text-muted-foreground")}>
            <p className="text-xs tracking-[0.14em] uppercase">{finished ? "Badge earned" : "Course badge"}</p>
            <p className="mt-1 font-heading text-xl">{language}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl text-brass">{value}</p>
    </div>
  );
}

function nodeClass(complete: boolean, current: boolean, item: RoadNode) {
  return cn(
    "flex items-center gap-3 rounded-2xl border px-3 py-3",
    complete && "border-brass/50 bg-card",
    current && "kindling-pulse border-primary bg-card",
    !complete && !current && "border-border bg-card/80",
    item.project && "border-brass/70",
  );
}

function NodeBody({ item, complete, current, locked = false }: { item: RoadNode; complete: boolean; current: boolean; locked?: boolean }) {
  return (
    <>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border text-xs", complete ? "border-brass bg-brass text-primary-foreground" : "border-border", current && "border-primary")} aria-hidden>
        {complete ? "✓" : locked ? "•" : item.project ? "P" : item.checkpoint ? "C" : ""}
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm">{item.title}</span>
        <span className="block text-xs text-muted-foreground">
          {locked ? "Locked" : complete ? "Cleared" : current ? "Current" : "Open"}
          {item.project ? " · Project" : ""}
          {item.checkpoint ? " · Checkpoint" : ""}
          {" · "}
          {item.xp} XP
        </span>
      </span>
    </>
  );
}
