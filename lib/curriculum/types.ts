import type { Check, Runner, TestCase } from "@/lib/runtime/types";

export type Exercise = {
  id: string;
  prompt: string;
  starter: string;
  solution: string;
  hints: string[];
  tests: TestCase[];
};

export type Resource = { label: string; href: string; kind: "docs" | "video" };

export type Milestone = {
  id: string;
  title: string;
  brief: string;
  tier: "Beginner" | "Intermediate" | "Advanced";
  paths: string[];
  step: number;
  steps: number;
};

export type Lesson = {
  slug: string;
  id?: string;
  title: string;
  minutes: number;
  xp: number;
  project: boolean;
  unit?: string;
  exercises?: Exercise[];
  milestone?: Milestone;
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
  level: "Language" | "Specialization" | "Framework";
  icon?: string;
  iconFallback?: string;
  difficulty?: "Beginner" | "Intermediate";
  tracks?: string[];
  honesty?: string;
  qt?: boolean;
  prelude?: string;
  units?: { title: string; slugs: string[] }[];
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
