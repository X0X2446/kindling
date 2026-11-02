import Link from "next/link";
import { courses } from "@/lib/curriculum";

export default function ProjectsPage() {
  const projects = courses.flatMap((course) =>
    course.lessons.filter((lesson) => lesson.project).map((lesson) => ({
      href: `/learn/${course.slug}/${lesson.slug}`,
      course: course.title,
      title: lesson.title,
      minutes: lesson.minutes,
      xp: lesson.xp,
    })),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-4xl">Projects</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Small programs with a job: a calculator, a tip split, a profile card, a night badge, a notes window, a tiny API.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {projects.map((project) => (
          <Link key={project.href} href={project.href} className="rounded-2xl border border-border bg-card p-5 hover:bg-muted">
            <p className="text-xs text-brass">{project.course}</p>
            <h2 className="mt-1 text-xl">{project.title}</h2>
            <p className="mt-2 text-xs text-muted-foreground">{project.minutes} min · {project.xp} XP</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
