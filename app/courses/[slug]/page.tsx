import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseRoadmap } from "@/components/roadmap";
import { courseMinutes, courses, getCourse, recommendations } from "@/lib/curriculum";
import { runnerLabel } from "@/lib/labels";

export const instant = false;

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();
  const next = recommendations(course.slug);

  const bySlug = new Map(course.lessons.map((lesson) => [lesson.slug, lesson]));
  const grouped = course.units?.length ? course.units : [{ title: "Lessons", slugs: course.lessons.map((lesson) => lesson.slug) }];
  const units = grouped.map((unit) => ({
    title: unit.title,
    items: unit.slugs.flatMap((slug) => {
      const lesson = bySlug.get(slug);
      if (!lesson) return [];
      return [{
        slug,
        title: lesson.title,
        xp: lesson.xp,
        project: lesson.project,
        checkpoint: unit.title === "Checkpoint" || slug === "drill" || slug === "average",
      }];
    }),
  }));

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-6">
        {course.honesty ? <p className="rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">{course.honesty}</p> : null}
        <CourseRoadmap
          course={course.slug}
          title={course.title}
          language={course.language}
          level={course.level}
          blurb={course.blurb}
          icon={course.icon ?? ""}
          iconFallback={course.iconFallback ?? ""}
          units={units}
        />
      </div>
      <aside className="flex flex-col gap-6">
        <div>
          <p className="text-xs text-muted-foreground">{runnerLabel(course.runner, course.qt)} · {course.lessons.length} lessons · {courseMinutes(course)} min</p>
          <h2 className="mt-4 text-lg">From the source</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {course.resources.map((resource) => (
              <li key={resource.href}>
                <a href={resource.href} target="_blank" rel="noreferrer" className="text-sm text-brass underline-offset-4 hover:underline">
                  {resource.kind === "video" ? "Video · " : "Docs · "}{resource.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {next.length ? (
          <div>
            <h2 className="text-lg">After this course</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {next.map((item) => (
                <li key={item.slug}>
                  <Link href={`/courses/${item.slug}`} className="text-sm hover:text-brass">{item.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
