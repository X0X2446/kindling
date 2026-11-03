import { courses } from "../lib/curriculum";
import { languageLessons } from "../lib/curriculum/track";
import type { Lesson } from "../lib/curriculum/types";
import { execute } from "../lib/runtime/execute";
import type { TestCase } from "../lib/runtime/types";

const slug = process.argv[2] ?? "cpp";
const course = courses.find((item) => item.slug === slug);
if (!course) {
  console.error(`No course named ${slug}.`);
  process.exit(1);
}

const banned = new Set(languageLessons("cpp", "C++", ["software", "games"]).map((lesson) => lesson.title));
let failed = 0;

function fail(message: string) {
  failed += 1;
  console.log(message);
}

if (slug === "cpp" && course.lessons.length < 60) {
  fail(`TOO FEW LESSONS ${course.lessons.length}`);
}

const others = courses.flatMap((other) =>
  other.lessons
    .filter((lesson) => other.slug !== course.slug || lesson.slug !== "")
    .map((lesson) => ({
      id: `${other.slug}:${lesson.slug}`,
      title: lesson.title,
      explanation: lesson.paragraphs.join("\n\n"),
      sameCourse: other.slug === course.slug,
      slug: lesson.slug,
    })),
);

for (const lesson of course.lessons) {
  const explanation = lesson.paragraphs.join("\n\n");
  for (const other of others) {
    if (other.sameCourse && other.slug === lesson.slug) continue;
    if (other.title === lesson.title) fail(`DUP TITLE ${JSON.stringify(lesson.title)} ${other.id}`);
    if (other.explanation === explanation) fail(`DUP EXPLANATION ${course.slug}:${lesson.slug} ${other.id}`);
  }
}

function words(lesson: Lesson) {
  return lesson.paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
}

function run(source: string, test: TestCase) {
  const code = `${course!.prelude ?? ""}${test.before ? `${test.before}\n` : ""}${source}`;
  const result = execute(course!.runner, code, test.stdin ?? "");
  const actual = result.stdout.replace(/\r\n/g, "\n");
  const expected = test.expected.replace(/\r\n/g, "\n");
  if (result.error || actual !== expected) {
    return result.error ?? `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`;
  }
  return "";
}

for (const lesson of course.lessons) {
  if (banned.has(lesson.title)) fail(`GENERIC ${lesson.slug} ${lesson.title}`);
  if (!lesson.id) fail(`NO ID ${lesson.slug}`);
  const count = words(lesson);
  if (count < 150 || count > 400) fail(`WORDS ${lesson.slug} ${count}`);
  if (lesson.check.kind !== "cases" || lesson.check.cases.length < 3) {
    fail(`NO TESTS ${lesson.slug}`);
    continue;
  }
  if (!lesson.exercises || lesson.exercises.length < 2 || lesson.exercises.length > 4) {
    fail(`EXERCISES ${lesson.slug} ${lesson.exercises?.length ?? 0}`);
  }
  for (const test of lesson.check.cases) {
    const error = run(lesson.solution, test);
    if (error) {
      fail(`SOLUTION ${lesson.slug}\n${error}`);
      break;
    }
  }
  for (const exercise of lesson.exercises ?? []) {
    if (exercise.tests.length < 1) fail(`EXERCISE TESTS ${lesson.slug} ${exercise.id}`);
    for (const test of exercise.tests) {
      const error = run(exercise.solution, test);
      if (error) {
        fail(`EXERCISE ${lesson.slug} ${exercise.id}\n${error}`);
        break;
      }
    }
  }
}

const minutes = course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
console.log(`${course.slug}: ${course.lessons.length} lessons, ${minutes} minutes (${(minutes / 60).toFixed(1)} hours)`);
console.log(failed ? `${failed} failed` : "verify-course ok");
process.exit(failed ? 1 : 0);
