"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgress } from "@/components/progress-provider";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { lessonKey } from "@/lib/keys";
import { rankFor } from "@/lib/progress";

type CourseCard = { slug: string; title: string; lessons: { slug: string; title: string }[] };

export function ProgressBoard({ courses }: { courses: CourseCard[] }) {
  const { ready, state, reset } = useProgress();
  const [confirm, setConfirm] = useState(false);
  const rank = rankFor(state.xp);
  const total = courses.reduce((sum, course) => sum + course.lessons.length, 0);
  const cleared = Object.keys(state.completed).length;

  if (ready && cleared === 0) {
    return (
      <Empty className="border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No sparks yet</EmptyTitle>
          <EmptyDescription>Your first lesson is one run away. Python starts from a blank file.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/learn/python/hello" className="text-sm text-brass underline-offset-4 hover:underline">Start the Python course</Link>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-brass">{ready ? rank.name : "…"}</p>
        <h1 className="mt-1 text-4xl">{ready ? `${state.xp} XP` : "…"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {state.streak > 0 ? `${state.streak} day streak. ` : "Clear a lesson today to start a streak. "}
          {cleared} of {total} lessons cleared.
          {rank.next ? ` Next rank: ${rank.next}.` : " You are at the top rank."}
        </p>
        <Progress value={Math.round(rank.into * 100)} className="mt-4 max-w-md" aria-label="Progress to the next rank" />
      </section>
      <div className="grid gap-3">
        {courses.map((course) => {
          const done = course.lessons.filter((lesson) => state.completed[lessonKey(course.slug, lesson.slug)]).length;
          return (
            <Link key={course.slug} href={`/courses/${course.slug}`} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted">
              <span className="text-sm">{course.title}</span>
              <span className="text-xs text-muted-foreground">{done}/{course.lessons.length}</span>
            </Link>
          );
        })}
      </div>
      {confirm ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">This clears XP, streak, and lesson history on this browser.</p>
          <Button type="button" variant="destructive" onClick={() => { reset(); setConfirm(false); }}>Reset progress</Button>
          <Button type="button" variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
        </div>
      ) : (
        <Button type="button" variant="ghost" className="self-start" onClick={() => setConfirm(true)}>Reset progress</Button>
      )}
    </div>
  );
}
