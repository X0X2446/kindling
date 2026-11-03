import { parseFrames, widgetTexts } from "./preview";
import type { Check, DrawOp, RunOutput } from "./types";

function norm(value: string) {
  return value.replace(/\r\n/g, "\n").trimEnd();
}

function colorAt(ops: DrawOp[], x: number, y: number) {
  let color: string | null = null;
  for (const op of ops) {
    if (op.op === "fillRect" && x >= op.x && x < op.x + op.w && y >= op.y && y < op.y + op.h) color = op.fill;
    if (op.op === "clearRect" && x >= op.x && x < op.x + op.w && y >= op.y && y < op.y + op.h) color = null;
    if (op.op === "arc") {
      const dx = x - op.x;
      const dy = y - op.y;
      if (dx * dx + dy * dy <= op.r * op.r) color = op.fill;
    }
  }
  return color?.toLowerCase() ?? null;
}

export function grade(check: Check, output: RunOutput): { ok: boolean; detail: string } {
  if (check.kind !== "html" && output.error) {
    return { ok: false, detail: output.error };
  }
  if (check.kind === "cases") {
    return { ok: false, detail: "Run each test on its own." };
  }
  if (check.kind === "stdout") {
    const actual = norm(output.stdout);
    const expected = norm(check.expected);
    if (actual === expected) return { ok: true, detail: "Output matches." };
    return { ok: false, detail: `Expected:\n${expected}\n\nYour program printed:\n${actual || "(nothing)"}` };
  }
  if (check.kind === "html") {
    const source = output.code.toLowerCase();
    const missing = check.parts.filter((part) => !source.includes(part.toLowerCase()));
    if (!missing.length) return { ok: true, detail: "The page has every piece this lesson asks for." };
    return { ok: false, detail: `Still missing: ${missing.join(", ")}` };
  }
  if (check.kind === "widgets" || check.kind === "app") {
    if (check.kind === "app" && norm(output.stdout) !== norm(check.expected)) {
      return { ok: false, detail: `Expected:\n${norm(check.expected)}\n\nYour program printed:\n${norm(output.stdout) || "(nothing)"}` };
    }
    const texts = widgetTexts(output.widgets).join("\n").toLowerCase();
    const missing = check.texts.filter((text) => !texts.includes(text.toLowerCase()));
    if (!missing.length) return { ok: true, detail: "The preview and the output both match." };
    return { ok: false, detail: `The preview is missing: ${missing.join(", ")}` };
  }
  if (check.kind === "frames") {
    const frames = output.frames ?? parseFrames(output.stdout);
    if (frames.length < check.frames) {
      return { ok: false, detail: `Expected at least ${check.frames} frame${check.frames === 1 ? "" : "s"}. Found ${frames.length}.` };
    }
    const commands = frames.flat().map((line) => line.split(/\s+/)[0]);
    const missing = check.commands.filter((command) => !commands.includes(command));
    if (!missing.length) return { ok: true, detail: "The frame has the drawing commands from the lesson." };
    return { ok: false, detail: `The frame is missing: ${missing.join(", ")}` };
  }
  const frames = output.canvas ?? [];
  for (const point of check.points) {
    const frame = frames.find((item) => item.t === point.t);
    const found = frame ? colorAt(frame.ops, point.x, point.y) : null;
    if (found !== point.fill.toLowerCase()) {
      return {
        ok: false,
        detail: `At t=${point.t}, the pixel (${point.x}, ${point.y}) should be ${point.fill}. It is ${found ?? "empty"}.`,
      };
    }
  }
  if (check.texts?.length) {
    const written = frames.flatMap((frame) => frame.ops.filter((op) => op.op === "fillText").map((op) => (op.op === "fillText" ? op.text : "")));
    const missing = check.texts.filter((text) => !written.some((item) => item.includes(text)));
    if (missing.length) return { ok: false, detail: `The canvas is missing the text: ${missing.join(", ")}` };
  }
  return { ok: true, detail: "The canvas matches this lesson." };
}
