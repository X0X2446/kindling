import { ProgressBoard } from "@/components/progress-board";
import { courses } from "@/lib/curriculum";

export default function ProgressPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <ProgressBoard
        courses={courses.map((course) => ({
          slug: course.slug,
          title: course.title,
          lessons: course.lessons.map((lesson) => ({ slug: lesson.slug, title: lesson.title })),
        }))}
      />
    </div>
  );
}
