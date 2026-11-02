"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useProgress } from "@/components/progress-provider";
import { lessonKey } from "@/lib/keys";
import { cn } from "@/lib/utils";

type TrailItem = { courseSlug: string; lessonSlug: string; courseTitle: string; title: string };

export function ContinueLink({ trail }: { trail: TrailItem[] }) {
  const { ready, state } = useProgress();
  const next = trail.find((item) => !state.completed[lessonKey(item.courseSlug, item.lessonSlug)]) ?? trail[0];
  if (!ready || !next) {
    return <Link href="/learn/python/hello" className={cn(buttonVariants({ size: "lg" }))}>Start with Python</Link>;
  }
  const started = Object.keys(state.completed).length > 0;
  return (
    <Link href={`/learn/${next.courseSlug}/${next.lessonSlug}`} className={cn(buttonVariants({ size: "lg" }))}>
      {started ? `Continue · ${next.title}` : "Start with Python"}
    </Link>
  );
}
