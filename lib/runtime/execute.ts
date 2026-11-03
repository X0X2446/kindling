import { runBash } from "./bash-run";
import { recordCanvas, CANVAS_TIMES } from "./canvas";
import { cToCpp } from "./c-to-cpp";
import { runInterpreted, type Lang } from "./engine";
import { runJavaScript } from "./js-run";
import { runLua } from "./lua-run";
import { runPolyglot } from "./polyglot";
import { fromWidget, parseFrames, splitWidgets } from "./preview";
import { runPython } from "./python-run";
import { runSql } from "./sql-run";
import { stripTypes } from "./strip-ts";
import type { RunOutput, Runner } from "./types";

const interpreted = new Set<Runner>(["java", "cpp", "csharp", "kotlin", "swift", "dart"]);
const polyglot = new Set<Runner>(["go", "rust", "php", "ruby", "r"]);

export function execute(runner: Runner, code: string, stdin = "", qt = false): RunOutput {
  if (runner === "html") return { code, stdout: "" };
  if (runner === "canvas") {
    const recorded = recordCanvas(code, CANVAS_TIMES);
    return { code, stdout: "", error: recorded.error, canvas: recorded.frames };
  }
  if (runner === "python") {
    const result = runPython(code, stdin, qt);
    const split = splitWidgets(result.stdout);
    return { code, stdout: split.text, error: result.error, widgets: split.widgets };
  }
  if (runner === "javascript" || runner === "typescript") {
    const source = runner === "typescript" ? stripTypes(code) : code;
    const result = runJavaScript(source, stdin);
    return { code, stdout: result.stdout, error: result.error };
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
  if (runner === "lua") {
    const result = runLua(code, stdin);
    return { code, stdout: result.stdout, error: result.error };
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
