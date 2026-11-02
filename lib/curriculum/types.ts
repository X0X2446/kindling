import type { Check, Runner } from "@/lib/runtime/types";

export type Resource = { label: string; href: string; kind: "docs" | "video" };

export type Lesson = {
  slug: string;
  title: string;
  minutes: number;
  xp: number;
  project: boolean;
  paragraphs: string[];
  sample?: string;
  starter: string;
  solution: string;
  hints: string[];
  stdin?: string;
  check: Check;
};

export type Course = {
  slug: string;
  title: string;
  language: string;
  runner: Runner;
  blurb: string;
  level: "Language" | "Specialization";
  honesty?: string;
  qt?: boolean;
  lessons: Lesson[];
  resources: Resource[];
  next: string[];
};

export type PathInfo = {
  slug: string;
  title: string;
  blurb: string;
  courses: string[];
};

export function lesson(input: Lesson): Lesson {
  return input;
}
