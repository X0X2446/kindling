import Link from "next/link";
import { ContinueLink } from "@/components/continue-link";
import { buttonVariants } from "@/components/ui/button";
import { courses, paths, trail } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12">
      <section className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-5">
          <p className="text-sm tracking-[0.18em] text-brass uppercase">Learn by doing</p>
          <h1 className="max-w-xl text-5xl leading-[1.05] text-balance sm:text-6xl">
            Light one small fire. Then the next.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Kindling teaches Python, JavaScript, HTML, Java, C++, C#, Lua, Kotlin, Swift, and Dart from a blank file. Each lesson explains the idea, then asks you to make a program run. Clear it, take the XP, and keep the streak.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ContinueLink trail={trail} />
            <Link href="/paths" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>Browse paths</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">A lesson feels like this</p>
          <pre className="mt-3 overflow-x-auto font-mono text-sm leading-6 text-foreground">{`lives = 3\nscore = 10\nprint(lives + score)`}</pre>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-background px-3 py-2 text-sm">
            <span className="font-mono text-muted-foreground">13</span>
            <span className="text-brass">Clean clear · +20 XP</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Paths</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {paths.map((path) => (
            <Link key={path.slug} href={`/paths/${path.slug}`} className="rounded-2xl border border-border bg-card p-5 hover:bg-muted">
              <h3 className="text-xl">{path.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{path.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Languages and what comes after</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.slug} href={`/courses/${course.slug}`} className="rounded-2xl border border-border bg-card p-4 hover:bg-muted">
              <p className="text-xs text-brass">{course.level}</p>
              <h3 className="mt-1 text-lg">{course.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{course.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-3">
        <div>
          <h2 className="text-lg">Read, then try</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">The explanation is short on purpose. The program in the editor is the part that teaches.</p>
        </div>
        <div>
          <h2 className="text-lg">Run it here</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Python, JavaScript, Lua, and HTML run as themselves. Java, C++, C#, Kotlin, Swift, and Dart use a teaching interpreter, so you never install a JDK.</p>
        </div>
        <div>
          <h2 className="text-lg">Then go further</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Finish Python and Kindling points you at Qt, machine learning, or a backend. Each course links the docs and videos it was built from.</p>
        </div>
      </section>
    </div>
  );
}
