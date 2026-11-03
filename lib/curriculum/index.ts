import { allProjects, courses, paths, type ProjectCard } from "./assemble";
import { lessonKey } from "@/lib/keys";
import type { Course, Lesson, PathInfo } from "./types";

export { allProjects, courses, paths, type ProjectCard };

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
