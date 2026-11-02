import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 py-20">
      <h1 className="text-4xl">That page is not on the map.</h1>
      <p className="text-sm text-muted-foreground">The lesson or path may have moved. The paths page still has every course.</p>
      <Link href="/paths" className="text-sm text-brass underline-offset-4 hover:underline">Back to paths</Link>
    </div>
  );
}
