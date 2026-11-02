import type { CanvasFrame, DrawOp } from "./types";

export function recordCanvas(code: string, times: number[]): { frames: CanvasFrame[]; error?: string } {
  const frames: CanvasFrame[] = [];
  try {
    for (const t of times) {
      const ops: DrawOp[] = [];
      const ctx = {
        fillStyle: "#000000",
        font: "16px sans-serif",
        _arc: null as { x: number; y: number; r: number } | null,
        fillRect(x: number, y: number, w: number, h: number) {
          ops.push({ op: "fillRect", x: Number(x), y: Number(y), w: Number(w), h: Number(h), fill: String(this.fillStyle) });
        },
        clearRect(x: number, y: number, w: number, h: number) {
          ops.push({ op: "clearRect", x: Number(x), y: Number(y), w: Number(w), h: Number(h) });
        },
        fillText(text: unknown, x: number, y: number) {
          ops.push({ op: "fillText", text: String(text), x: Number(x), y: Number(y), fill: String(this.fillStyle) });
        },
        beginPath() {
          this._arc = null;
        },
        arc(x: number, y: number, r: number) {
          this._arc = { x: Number(x), y: Number(y), r: Number(r) };
        },
        fill() {
          if (this._arc) ops.push({ op: "arc", ...this._arc, fill: String(this.fillStyle) });
        },
        stroke() {},
      };
      const run = new Function(
        "ctx",
        "t",
        `${code}\nif (typeof draw !== "function") throw new Error("Define a function named draw(ctx, t).");\ndraw(ctx, t);`,
      );
      run(ctx, t);
      frames.push({ t, ops });
    }
    return { frames };
  } catch (error) {
    return { frames, error: error instanceof Error ? error.message : "The canvas runner stopped." };
  }
}

export const CANVAS_TIMES = [0, 0.25, 0.5, 0.75, 1];
