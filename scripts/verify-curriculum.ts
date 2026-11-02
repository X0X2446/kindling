import { courses } from "../lib/curriculum";
import { grade } from "../lib/runtime/grade";
import { execute } from "../lib/runtime/execute";

let failed = 0;
let checked = 0;
for (const course of courses) {
  for (const lesson of course.lessons) {
    checked += 1;
    const solved = execute(course.runner, lesson.solution, lesson.stdin, Boolean(course.qt));
    const pass = grade(lesson.check, solved);
    if (!pass.ok) {
      failed += 1;
      console.log("SOLUTION FAIL", course.slug, lesson.slug);
      console.log(pass.detail);
      console.log("stdout", JSON.stringify(solved.stdout));
      console.log("error", solved.error);
      console.log("widgets", JSON.stringify(solved.widgets));
    }
    const started = execute(course.runner, lesson.starter, lesson.stdin, Boolean(course.qt));
    const starterGrade = grade(lesson.check, started);
    if (starterGrade.ok) {
      failed += 1;
      console.log("STARTER PASSED", course.slug, lesson.slug);
    }
  }
}
console.log(failed ? `${failed} failed of ${checked}` : `all ${checked} lessons ok`);
process.exit(failed ? 1 : 0);
