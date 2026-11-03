"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Logo({
  src,
  fallback,
  alt,
  className,
}: {
  src: string;
  fallback?: string;
  alt: string;
  className?: string;
}) {
  const [current, setCurrent] = useState(src);
  return (
    // Official brand marks from Devicon, with Simple Icons if a file is missing.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={cn("bg-white/95 object-contain p-1", className)}
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
