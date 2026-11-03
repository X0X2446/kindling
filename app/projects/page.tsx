import { ProjectBrowser } from "@/components/project-browser";
import { allProjects, courses, paths } from "@/lib/curriculum";

export default function ProjectsPage() {
  const projects = allProjects();
  const languages = [...new Set(courses.map((course) => course.language))].sort((a, b) => a.localeCompare(b));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-4xl">Projects</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Small programs with a job, grouped by language and path. Each one has milestones, a starter, hints, and a finished solution you can reveal after you try.
        </p>
      </div>
      <ProjectBrowser
        projects={projects}
        languages={languages}
        paths={paths.map((path) => ({ slug: path.slug, title: path.title }))}
      />
    </div>
  );
}
