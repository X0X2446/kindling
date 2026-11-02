"use client";

import Link from "next/link";
import { useProgress } from "@/components/progress-provider";
import { lessonKey } from "@/lib/keys";

type Item = { slug: string; title: string; minutes: number; xp: number; project: boolean };

export function CourseOutline({ course, items }: { course: string; items: Item[] }) {
  const { state } = useProgress();
  const done = items.filter((item) => state.completed[lessonKey(course, item.slug)]).length;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{done} of {items.length} cleared</p>
      <ol className="flex flex-col gap-2">
        {items.map((item, index) => {
          const record = state.completed[lessonKey(course, item.slug)];
          return (
            <li key={item.slug}>
              <Link href={`/learn/${course}/${item.slug}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted">
                <span className="flex items-center gap-3">
                  <span className={record ? "size-2.5 rounded-full bg-flame" : "size-2.5 rounded-full border border-border"} aria-hidden />
                  <span>
                    <span className="block text-sm">{index + 1}. {item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.project ? "Project · " : ""}{item.minutes} min · {item.xp} XP</span>
                  </span>
                </span>
                {record?.clean ? <span className="text-xs text-brass">Clean</span> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
