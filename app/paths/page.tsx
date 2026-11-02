import Link from "next/link";
import { paths } from "@/lib/curriculum";

export default function PathsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-4xl">Paths</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          A path is an order. You can open any lesson without finishing the one before it.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {paths.map((path) => (
          <Link key={path.slug} href={`/paths/${path.slug}`} className="rounded-2xl border border-border bg-card p-5 hover:bg-muted">
            <h2 className="text-2xl">{path.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{path.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
