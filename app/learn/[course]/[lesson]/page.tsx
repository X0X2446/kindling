import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/lesson-player";
import { courses, getLesson, recommendations } from "@/lib/curriculum";
import { runnerLabel } from "@/lib/labels";

export const instant = false;

export function generateStaticParams() {
  return courses.flatMap((course) => course.lessons.map((lesson) => ({ course: course.slug, lesson: lesson.slug })));
}

export default async function LessonPage({ params }: { params: Promise<{ course: string; lesson: string }> }) {
  const { course: courseSlug, lesson: lessonSlug } = await params;
  const found = getLesson(courseSlug, lessonSlug);
  if (!found) notFound();
  const { course, lesson, index } = found;
  const previous = course.lessons[index - 1];
  const upcoming = course.lessons[index + 1];
  const follow = upcoming ? [] : recommendations(course.slug);

  return (
    <LessonPlayer
      courseSlug={course.slug}
      courseTitle={course.title}
      lessonSlug={lesson.slug}
      title={lesson.title}
      index={index}
      count={course.lessons.length}
      xp={lesson.xp}
      project={lesson.project}
      paragraphs={lesson.paragraphs}
      sample={lesson.sample}
      starter={lesson.starter}
      solution={lesson.solution}
      hints={lesson.hints}
      stdin={lesson.stdin}
      check={lesson.check}
      exercises={lesson.exercises}
      runner={course.runner}
      qt={Boolean(course.qt)}
      prelude={course.prelude}
      label={runnerLabel(course.runner, course.qt)}
      honesty={course.honesty}
      prevSlug={previous?.slug}
      prevHref={previous ? `/learn/${course.slug}/${previous.slug}` : undefined}
      prevTitle={previous?.title}
      nextHref={upcoming ? `/learn/${course.slug}/${upcoming.slug}` : undefined}
      nextTitle={upcoming?.title}
      milestone={lesson.milestone ? {
        title: lesson.milestone.title,
        brief: lesson.milestone.brief,
        step: lesson.milestone.step,
        steps: lesson.milestone.steps,
        tier: lesson.milestone.tier,
      } : undefined}
      recommendations={follow.map((item) => ({ slug: item.slug, title: item.title, blurb: item.blurb }))}
    />
  );
}
