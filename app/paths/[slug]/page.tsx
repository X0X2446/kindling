import Link from "next/link";
import { notFound } from "next/navigation";
import { courseMinutes, courses, getCourse, paths } from "@/lib/curriculum";

export const instant = false;

export function generateStaticParams() {
  return paths.map((path) => ({ slug: path.slug }));
}

export default async function PathPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = paths.find((item) => item.slug === slug);
  if (!path) notFound();
  const ordered = path.courses.map((item) => getCourse(item)).filter((item) => item !== undefined);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-sm text-brass">Path</p>
        <h1 className="mt-1 text-4xl">{path.title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{path.blurb}</p>
      </div>
      <ol className="flex flex-col gap-3">
        {ordered.map((course, index) => (
          <li key={course.slug}>
            <Link href={`/courses/${course.slug}`} className="block rounded-2xl border border-border bg-card p-5 hover:bg-muted">
              <p className="text-xs text-muted-foreground">Step {index + 1} · {course.lessons.length} lessons · {courseMinutes(course)} min</p>
              <h2 className="mt-1 text-2xl">{course.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{course.blurb}</p>
            </Link>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">{courses.length} courses live on Kindling. This path is one way through them.</p>
    </div>
  );
}
