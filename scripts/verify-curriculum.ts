import { allProjects, courses, paths } from "../lib/curriculum";
import { execute } from "../lib/runtime/execute";
import { grade } from "../lib/runtime/grade";
import type { Check, RunOutput } from "../lib/runtime/types";
import type { Course, Lesson } from "../lib/curriculum/types";

function norm(value: string) {
  return value.replace(/\r\n/g, "\n").trimEnd();
}

function runLesson(course: Course, lesson: Lesson, code: string, test: { stdin?: string; before?: string; expected: string }) {
  const source = `${course.prelude ?? ""}${test.before ? `${test.before}\n` : ""}${code}`;
  return execute(course.runner, source, test.stdin ?? lesson.stdin ?? "", Boolean(course.qt));
}

function matches(check: Check, result: RunOutput) {
  if (check.kind === "cases") return { ok: false, detail: "cases are graded one at a time" };
  return grade(check, result);
}

let failed = 0;
let checked = 0;
for (const course of courses) {
  for (const lesson of course.lessons) {
    checked += 1;
    if (lesson.check.kind === "cases") {
      let solutionOk = true;
      for (const test of lesson.check.cases) {
        const solved = runLesson(course, lesson, lesson.solution, test);
        const actual = norm(solved.stdout);
        const expected = norm(test.expected);
        if (solved.error || actual !== expected) {
          solutionOk = false;
          failed += 1;
          console.log("SOLUTION FAIL", course.slug, lesson.slug);
          console.log(solved.error ?? `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
          break;
        }
      }
      if (!solutionOk) continue;
      const starterOk = lesson.check.cases.every((test) => {
        const started = runLesson(course, lesson, lesson.starter, test);
        return !started.error && norm(started.stdout) === norm(test.expected);
      });
      if (starterOk) {
        failed += 1;
        console.log("STARTER PASSED", course.slug, lesson.slug);
      }
      continue;
    }
    const solved = runLesson(course, lesson, lesson.solution, { stdin: lesson.stdin, expected: "" });
    const pass = matches(lesson.check, { ...solved, code: lesson.solution });
    if (!pass.ok) {
      failed += 1;
      console.log("SOLUTION FAIL", course.slug, lesson.slug);
      console.log(pass.detail);
    }
    const started = runLesson(course, lesson, lesson.starter, { stdin: lesson.stdin, expected: "" });
    const starterGrade = matches(lesson.check, { ...started, code: lesson.starter });
    if (starterGrade.ok) {
      failed += 1;
      console.log("STARTER PASSED", course.slug, lesson.slug);
    }
  }
}

const projects = allProjects();
for (const course of courses) {
  if (course.level !== "Language") continue;
  const ids = new Set(course.lessons.filter((lesson) => lesson.milestone).map((lesson) => lesson.milestone!.id));
  const loose = course.lessons.filter((lesson) => lesson.project && !lesson.milestone).length;
  if (course.lessons.length < 15) {
    failed += 1;
    console.log("SHORT COURSE", course.slug, course.lessons.length);
  }
  if (ids.size + loose < 8) {
    failed += 1;
    console.log("FEW PROJECTS", course.slug, ids.size + loose);
  }
}
for (const path of paths) {
  const count = projects.filter((project) => project.paths.includes(path.slug) || path.courses.includes(project.courseSlug)).length;
  if (count < 8) {
    failed += 1;
    console.log("PATH", path.slug, count);
  }
}

console.log(`${courses.length} courses, ${checked} lessons, ${projects.length} projects`);
console.log(failed ? `${failed} failed of ${checked}` : `all ${checked} lessons ok`);
process.exit(failed ? 1 : 0);
