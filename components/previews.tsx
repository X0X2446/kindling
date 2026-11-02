"use client";

import { useEffect, useRef } from "react";
import { paintOps } from "@/lib/runtime/preview";
import type { CanvasFrame, PreviewNode } from "@/lib/runtime/types";

export function WidgetPreview({ node }: { node: PreviewNode }) {
  const title = node.type === "window" ? node.title : "Preview";
  const body = node.type === "window" ? node.children : [node];
  return (
    <div className="mx-auto w-full max-w-[260px] rounded-[28px] border border-border bg-black p-3 shadow-[0_20px_60px_oklch(0_0_0/0.35)]">
      <div className="min-h-64 rounded-[20px] bg-[#171310] p-3">
        <p className="mb-3 text-center text-[11px] tracking-wide text-brass">{title || "Preview"}</p>
        <div className="flex flex-col gap-2">
          {body.map((child, index) => (
            <WidgetBranch key={index} node={child} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WidgetBranch({ node }: { node: PreviewNode }) {
  if (node.type === "text") return <p className="text-sm text-foreground">{node.text}</p>;
  if (node.type === "button") {
    return <div className="rounded-lg bg-flame px-3 py-2 text-center text-sm text-primary-foreground">{node.text || "Button"}</div>;
  }
  if (node.type === "field") {
    return <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">{node.text || "Text field"}</div>;
  }
  const row = node.type === "row";
  return (
    <div className={row ? "flex flex-row gap-2" : "flex flex-col gap-2"}>
      {node.children.map((child, index) => (
        <WidgetBranch key={index} node={child} />
      ))}
    </div>
  );
}

export function HtmlPreview({ code }: { code: string }) {
  return (
    <iframe
      title="Page preview"
      sandbox="allow-scripts"
      srcDoc={code}
      className="h-72 w-full rounded-xl border border-border bg-white"
    />
  );
}

export function CanvasPreview({ frames }: { frames: CanvasFrame[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const samples = frames.length ? frames : [];
    if (!samples.length) return;
    let index = 0;
    const draw = () => {
      paintOps(context, samples[index % samples.length].ops);
      index += 1;
    };
    draw();
    if (samples.length < 2) return;
    const timer = window.setInterval(draw, 280);
    return () => window.clearInterval(timer);
  }, [frames]);
  return <canvas ref={ref} width={320} height={180} className="w-full max-w-[480px] rounded-xl border border-border bg-[#14110e]" />;
}

export function FramePreview({ frames }: { frames: string[][] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const samples = frames.length ? frames : [];
    let index = 0;
    const draw = () => {
      const commands = samples[index % Math.max(samples.length, 1)] ?? [];
      context.clearRect(0, 0, 320, 180);
      context.fillStyle = "#14110e";
      context.fillRect(0, 0, 320, 180);
      for (const line of commands) {
        const [command, ...rest] = line.split(/\s+/);
        if (command === "fill") {
          const [r, g, b] = rest.map(Number);
          context.fillStyle = `rgb(${r} ${g} ${b})`;
          context.fillRect(0, 0, 320, 180);
        } else if (command === "rect") {
          const [x, y, w, h, r, g, b] = rest.map(Number);
          context.fillStyle = `rgb(${r} ${g} ${b})`;
          context.fillRect(x, y, w, h);
        } else if (command === "circle") {
          const [x, y, radius, r, g, b] = rest.map(Number);
          context.fillStyle = `rgb(${r} ${g} ${b})`;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        } else if (command === "text") {
          const [x, y, ...words] = rest;
          context.fillStyle = "#f4efe6";
          context.font = "16px sans-serif";
          context.fillText(words.join(" "), Number(x), Number(y));
        }
      }
      index += 1;
    };
    draw();
    if (samples.length < 2) return;
    const timer = window.setInterval(draw, 400);
    return () => window.clearInterval(timer);
  }, [frames]);
  return <canvas ref={ref} width={320} height={180} className="w-full max-w-[480px] rounded-xl border border-border" />;
}
