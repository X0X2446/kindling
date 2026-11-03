import { runBash } from "./bash-run";
import { cToCpp } from "./c-to-cpp";
import { runInterpreted, type Lang } from "./engine";
import { runPolyglot } from "./polyglot";
import { fromWidget, parseFrames, splitWidgets } from "./preview";
import { QT_PRELUDE } from "./python-qt";
import { runSql } from "./sql-run";
import { stripTypes } from "./strip-ts";
import type { CanvasFrame, RunOutput, Runner } from "./types";

const interpreted = new Set<Runner>(["java", "cpp", "csharp", "kotlin", "swift", "dart"]);
const polyglot = new Set<Runner>(["go", "rust", "php", "ruby", "r"]);

type WorkerReply = {
  id: number;
  stdout?: string;
  error?: string;
  phase?: string;
  canvas?: CanvasFrame[];
};

function once(worker: Worker, id: number, timeout: number, onPhase?: (phase: string) => void) {
  return new Promise<WorkerReply>((resolve) => {
    const timer = window.setTimeout(() => {
      worker.terminate();
      resolve({ id, error: "This ran too long. Look for a loop that never ends." });
    }, timeout);
    const onMessage = (event: MessageEvent<WorkerReply>) => {
      if (event.data.id !== id) return;
      if (event.data.phase) {
        onPhase?.(event.data.phase);
        return;
      }
      window.clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      resolve(event.data);
    };
    worker.addEventListener("message", onMessage);
  });
}

let sandbox: Worker | null = null;
let pythonWorker: Worker | null = null;
let pythonAlive = false;
let nextId = 1;

function freshSandbox() {
  sandbox?.terminate();
  sandbox = new Worker("/sandbox-worker.js");
  return sandbox;
}

function python() {
  if (!pythonAlive || !pythonWorker) {
    pythonWorker?.terminate();
    pythonWorker = new Worker("/pyodide-worker.js");
    pythonAlive = true;
  }
  return pythonWorker;
}

export async function runCode(
  runner: Runner,
  code: string,
  stdin = "",
  qt = false,
  onPhase?: (phase: string) => void,
): Promise<RunOutput> {
  if (runner === "html") return { code, stdout: "" };
  if (runner === "canvas") {
    const worker = freshSandbox();
    const id = nextId++;
    const pending = once(worker, id, 1500);
    worker.postMessage({ id, mode: "canvas", code, times: [0, 0.25, 0.5, 0.75, 1] });
    const result = await pending;
    return { code, stdout: "", error: result.error, canvas: result.canvas ?? [] };
  }
  if (runner === "javascript" || runner === "typescript") {
    const worker = freshSandbox();
    const id = nextId++;
    const pending = once(worker, id, 1500);
    worker.postMessage({ id, mode: "js", code: runner === "typescript" ? stripTypes(code) : code, stdin });
    const result = await pending;
    return { code, stdout: result.stdout ?? "", error: result.error };
  }
  if (runner === "bash") {
    const result = runBash(code, stdin);
    return { code, stdout: result.stdout, error: result.error };
  }
  if (runner === "sql") {
    const result = runSql(code);
    return { code, stdout: result.stdout, error: result.error };
  }
  if (runner === "c") {
    const result = runInterpreted("cpp", cToCpp(code), stdin);
    return { code, stdout: result.stdout, error: result.error, widgets: result.widgets ? fromWidget(result.widgets) : null, frames: parseFrames(result.stdout) };
  }
  if (polyglot.has(runner)) {
    const result = runPolyglot(runner as "go" | "rust" | "php" | "ruby" | "r", code, stdin);
    return { code, stdout: result.stdout, error: result.error };
  }
  if (runner === "python") {
    const worker = python();
    const id = nextId++;
    const pending = once(worker, id, 30000, onPhase);
    worker.postMessage({ id, code: `${qt ? QT_PRELUDE : ""}\n${code}`, stdin });
    const result = await pending;
    if (result.error?.includes("too long")) pythonAlive = false;
    const split = splitWidgets(result.stdout ?? "");
    return { code, stdout: split.text, error: result.error, widgets: split.widgets };
  }
  if (runner === "lua") {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runner: "lua", code, stdin }),
    });
    if (!response.ok) return { code, stdout: "", error: "The Lua runner could not start." };
    const result = (await response.json()) as { stdout?: string; error?: string };
    return { code, stdout: result.stdout ?? "", error: result.error };
  }
  if (interpreted.has(runner)) {
    const result = runInterpreted(runner as Lang, code, stdin);
    return {
      code,
      stdout: result.stdout,
      error: result.error,
      widgets: result.widgets ? fromWidget(result.widgets) : null,
      frames: parseFrames(result.stdout),
    };
  }
  return { code, stdout: "", error: "This runner is not available." };
}
