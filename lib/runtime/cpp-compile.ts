import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type CppResult = { stdout: string; error?: string };

const MAX_CODE = 50000;
const MAX_STDIN = 8000;
const MAX_OUTPUT = 16000;

function clip(text: string) {
  const clean = text.replace(/\u0000/g, "").replace(/\/(?:[^/\s]+\/)+main\.cpp/g, "main.cpp");
  if (clean.length <= MAX_OUTPUT) return clean;
  return `${clean.slice(0, MAX_OUTPUT)}\n…output truncated`;
}

function failure(status: number | null, stderr: string, stdout: string): CppResult {
  if (status === 124 || status === 137) {
    return { stdout: clip(stdout), error: "The program ran too long and was stopped." };
  }
  const detail = clip(stderr || stdout || "The program stopped.");
  return { stdout: "", error: detail || "The program stopped." };
}

export function gppAvailable() {
  const found = spawnSync("g++", ["--version"], { encoding: "utf8", timeout: 5000 });
  return found.status === 0;
}

/** Compile student source unchanged so g++ line numbers match the editor, then run it offline. */
export function compileAndRunCpp(code: string, stdin = ""): CppResult {
  if (!code.trim()) return { stdout: "", error: "The program is empty." };
  if (code.length > MAX_CODE) return { stdout: "", error: "The program is too long." };
  const input = stdin.slice(0, MAX_STDIN);
  const dir = mkdtempSync(join(tmpdir(), "kindling-cpp-"));
  try {
    writeFileSync(join(dir, "main.cpp"), code, "utf8");
    const compiled = spawnSync(
      "g++",
      ["-std=c++20", "-O1", "-Wall", "-Wextra", "-fno-diagnostics-color", "-o", "prog", "main.cpp"],
      { cwd: dir, timeout: 20000, encoding: "utf8", env: { PATH: "/usr/bin:/bin" }, maxBuffer: 1024 * 1024 },
    );
    if (compiled.error) {
      return { stdout: "", error: compiled.error.message.includes("ETIMEDOUT") ? "The compiler took too long." : "The compiler could not start." };
    }
    if (compiled.status !== 0) {
      return { stdout: "", error: clip(compiled.stderr || compiled.stdout || "The program did not compile.") };
    }
    const ran = spawnSync(
      "unshare",
      [
        "--net",
        "--map-root-user",
        "--",
        "timeout",
        "--signal=KILL",
        "2",
        "prlimit",
        "--as=268435456",
        "--nproc=64",
        "--fsize=1048576",
        "--",
        "./prog",
      ],
      {
        cwd: dir,
        input,
        timeout: 8000,
        encoding: "utf8",
        env: { PATH: "/usr/bin:/bin" },
        maxBuffer: 1024 * 1024,
      },
    );
    if (ran.error) {
      const message = ran.error.message ?? "";
      if (message.includes("ETIMEDOUT") || message.includes("SIGTERM")) {
        return { stdout: clip(ran.stdout ?? ""), error: "The program ran too long and was stopped." };
      }
      return { stdout: "", error: "The sandbox could not start the program. It was not run with network access." };
    }
    if (ran.status !== 0) return failure(ran.status, ran.stderr ?? "", ran.stdout ?? "");
    return { stdout: clip(ran.stdout ?? "") };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
