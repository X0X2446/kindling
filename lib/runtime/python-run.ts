import { spawnSync } from "node:child_process";
import { QT_PRELUDE } from "./python-qt";

export function runPython(code: string, stdin = "", qt = false): { stdout: string; error?: string } {
  const source = `${qt ? QT_PRELUDE : ""}\n${code}`;
  const result = spawnSync("python3", ["-I", "-c", source], {
    input: stdin,
    encoding: "utf8",
    timeout: 4000,
  });
  if (result.error) return { stdout: result.stdout ?? "", error: result.error.message };
  const stdout = result.stdout ?? "";
  if (result.status !== 0) {
    const stderr = (result.stderr ?? "").trim();
    const line = stderr.split("\n").filter(Boolean).at(-1) ?? "Python stopped.";
    return { stdout, error: line };
  }
  return { stdout };
}
