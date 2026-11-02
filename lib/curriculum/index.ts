import { dart, kotlin, swift } from "./mobile";
import { python } from "./python";
import { pythonBackend, pythonMl, pythonQt } from "./special";
import { cpp, cppGames, csharp, java, lua } from "./systems";
import { lessonKey } from "@/lib/keys";
import type { Course, Lesson, PathInfo } from "./types";
import { html, html5, javascript } from "./web";

export const courses: Course[] = [
  python,
  javascript,
  html,
  html5,
  java,
  cpp,
  cppGames,
  csharp,
  lua,
  kotlin,
  swift,
  dart,
  pythonQt,
  pythonMl,
  pythonBackend,
];

export const paths: PathInfo[] = [
  {
    slug: "frontend",
    title: "Frontend",
    blurb: "Pages, then the language that makes them move, then a canvas you can animate.",
    courses: ["html", "javascript", "html5-games"],
  },
  {
    slug: "backend",
    title: "Backend",
    blurb: "Python first, then the shape of an API: routes, JSON, and a notes handler.",
    courses: ["python", "python-backend"],
  },
  {
    slug: "mobile",
    title: "Mobile",
    blurb: "Kotlin and Compose, Dart and Flutter, Swift and SwiftUI. The language, then a screen.",
    courses: ["kotlin", "dart", "swift"],
  },
  {
    slug: "software",
    title: "Software",
    blurb: "Four languages you will meet in jobs and codebases, each taught from a blank file.",
    courses: ["python", "java", "csharp", "cpp"],
  },
  {
    slug: "games",
    title: "Games",
    blurb: "Lua for scripts, C++ that thinks in frames, and HTML5 canvas for a title screen.",
    courses: ["lua", "cpp-games", "html5-games"],
  },
];

export function getCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}

export function getLesson(courseSlug: string, lessonSlug: string): { course: Course; lesson: Lesson; index: number } | null {
  const course = getCourse(courseSlug);
  if (!course) return null;
  const index = course.lessons.findIndex((item) => item.slug === lessonSlug);
  if (index < 0) return null;
  return { course, lesson: course.lessons[index], index };
}

export { lessonKey };

export function courseMinutes(course: Course) {
  return course.lessons.reduce((sum, item) => sum + item.minutes, 0);
}

export function recommendations(slug: string) {
  const course = getCourse(slug);
  if (!course) return [];
  return course.next.map((item) => getCourse(item)).filter((item): item is Course => Boolean(item));
}

export const trail = courses.flatMap((course) =>
  course.lessons.map((item) => ({
    courseSlug: course.slug,
    lessonSlug: item.slug,
    courseTitle: course.title,
    title: item.title,
  })),
);

export type { Course, Lesson, PathInfo };
