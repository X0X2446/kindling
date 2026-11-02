import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseOutline } from "@/components/course-outline";
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

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-brass">{course.level} · {course.language}</p>
          <h1 className="mt-1 text-4xl">{course.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{course.blurb}</p>
          <p className="mt-2 text-xs text-muted-foreground">{runnerLabel(course.runner, course.qt)} · {course.lessons.length} lessons · {courseMinutes(course)} min</p>
        </div>
        {course.honesty ? <p className="rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">{course.honesty}</p> : null}
        <CourseOutline
          course={course.slug}
          items={course.lessons.map((lesson) => ({
            slug: lesson.slug,
            title: lesson.title,
            minutes: lesson.minutes,
            xp: lesson.xp,
            project: lesson.project,
          }))}
        />
      </div>
      <aside className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg">From the source</h2>
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
