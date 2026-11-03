import { lesson, type Exercise, type Lesson, type Milestone } from "@/lib/curriculum/types";
import type { TestCase } from "@/lib/runtime/types";

export type CppSpec = {
  id: string;
  title: string;
  minutes: number;
  unit: string;
  explanation: string;
  sample?: string;
  exercises: Exercise[];
  starter: string;
  solution: string;
  hints: string[];
  tests: TestCase[];
  project?: boolean;
  milestone?: Milestone;
};

export function cppLesson(spec: CppSpec): Lesson {
  return lesson({
    slug: spec.id,
    id: spec.id,
    title: spec.title,
    minutes: spec.minutes,
    xp: spec.project ? 60 : 30,
    project: Boolean(spec.project),
    unit: spec.unit,
    milestone: spec.milestone,
    paragraphs: spec.explanation.trim().split(/\n\s*\n/).map((paragraph) => paragraph.trim()),
    sample: spec.sample,
    starter: spec.starter,
    solution: spec.solution,
    hints: spec.hints,
    exercises: spec.exercises,
    check: { kind: "cases", cases: spec.tests },
  });
}

export function program(body: string, headers: string[] = ["iostream"]) {
  const includes = headers.map((header) => `#include <${header}>`).join("\n");
  return `${includes}\n\nint main() {\n${body}\n  return 0;\n}\n`;
}

export function drill(
  id: string,
  prompt: string,
  starter: string,
  solution: string,
  tests: TestCase[],
  hints: string[],
): Exercise {
  return { id, prompt, starter, solution, hints, tests };
}
