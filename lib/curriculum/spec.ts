import { emitter, type Emitter, type Lang } from "./emit";
import type { Lesson, Milestone } from "./types";

export type Spec = {
  slug: string;
  title: string;
  unit: string;
  minutes?: number;
  xp?: number;
  paragraphs: string[];
  hints: string[];
  cases: { stdin?: string; before?: string; expected: string }[];
  milestone?: Milestone;
  solve: (e: Emitter) => string;
  starter?: (e: Emitter) => string;
};

export function fromSpecs(lang: Lang, specs: Spec[]): Lesson[] {
  const e = emitter(lang);
  return specs.map((spec) => {
    const solution = spec.solve(e);
    const starter = spec.starter ? spec.starter(e) : e.program([e.comment(spec.title), e.print(e.str("todo"))]);
    return {
      slug: spec.slug,
      title: spec.title,
      unit: spec.unit,
      minutes: spec.minutes ?? (spec.milestone ? 10 : 8),
      xp: spec.xp ?? (spec.milestone ? 35 : 25),
      project: Boolean(spec.milestone),
      milestone: spec.milestone,
      paragraphs: spec.paragraphs,
      sample: solution,
      starter,
      solution,
      hints: spec.hints,
      stdin: spec.cases[0]?.stdin,
      check: { kind: "cases", cases: spec.cases },
    };
  });
}

export function milestone(id: string, title: string, brief: string, tier: Milestone["tier"], step: number, steps: number, paths: string[]): Milestone {
  return { id, title, brief, tier, paths, step, steps };
}

export function rawLesson(input: {
  slug: string;
  title: string;
  unit: string;
  paragraphs: string[];
  hints: string[];
  solution: string;
  starter: string;
  cases: { stdin?: string; before?: string; expected: string }[];
  milestone?: Milestone;
  minutes?: number;
  xp?: number;
}): Lesson {
  return {
    slug: input.slug,
    title: input.title,
    unit: input.unit,
    minutes: input.minutes ?? (input.milestone ? 10 : 8),
    xp: input.xp ?? (input.milestone ? 35 : 25),
    project: Boolean(input.milestone),
    milestone: input.milestone,
    paragraphs: input.paragraphs,
    sample: input.solution,
    starter: input.starter,
    solution: input.solution,
    hints: input.hints,
    stdin: input.cases[0]?.stdin,
    check: { kind: "cases", cases: input.cases },
  };
}
