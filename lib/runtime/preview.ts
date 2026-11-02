import type { WidgetNode } from "./engine";
import type { CanvasFrame, DrawOp, PreviewNode } from "./types";

export function fromWidget(node: WidgetNode): PreviewNode {
  if (node.type === "window") {
    return { type: "window", title: node.title, text: "", children: node.children.map(fromWidget) };
  }
  if (node.type === "column" || node.type === "row") {
    return { type: node.type, title: "", text: "", children: node.children.map(fromWidget) };
  }
  return { type: node.type, title: "", text: "text" in node ? node.text : "", children: [] };
}

export function splitWidgets(stdout: string): { text: string; widgets: PreviewNode | null } {
  const lines = stdout.split("\n");
  const marker = lines.find((line) => line.startsWith("[[WIDGETS]]"));
  const text = lines.filter((line) => !line.startsWith("[[WIDGETS]]")).join("\n");
  if (!marker) return { text, widgets: null };
  try {
    const parsed = JSON.parse(marker.slice("[[WIDGETS]]".length)) as PreviewNode;
    return { text, widgets: parsed };
  } catch {
    return { text, widgets: null };
  }
}

export function widgetTexts(node: PreviewNode | null | undefined): string[] {
  if (!node) return [];
  const found = [node.title, node.text].filter(Boolean);
  for (const child of node.children ?? []) found.push(...widgetTexts(child));
  return found;
}

export function parseFrames(stdout: string): string[][] {
  const frames: string[][] = [];
  let current: string[] | null = null;
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "[[FRAME]]") current = [];
    else if (trimmed === "[[END]]" && current) {
      frames.push(current);
      current = null;
    } else if (current && trimmed) current.push(trimmed);
  }
  return frames;
}

export function paintOps(ctx: CanvasRenderingContext2D, ops: DrawOp[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const op of ops) {
    if (op.op === "fillRect") {
      ctx.fillStyle = op.fill;
      ctx.fillRect(op.x, op.y, op.w, op.h);
    } else if (op.op === "clearRect") {
      ctx.clearRect(op.x, op.y, op.w, op.h);
    } else if (op.op === "arc") {
      ctx.fillStyle = op.fill;
      ctx.beginPath();
      ctx.arc(op.x, op.y, op.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (op.op === "fillText") {
      ctx.fillStyle = op.fill;
      ctx.font = "16px sans-serif";
      ctx.fillText(op.text, op.x, op.y);
    }
  }
}

export function playableFrames(frames: CanvasFrame[]): CanvasFrame[] {
  return frames.length ? frames : [{ t: 0, ops: [] }];
}
