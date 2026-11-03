import { randomBytes } from "node:crypto";
import { Sandbox } from "@vercel/sandbox";
import type { CppResult } from "./cpp-compile";

const MAX_OUTPUT = 16000;

function clip(text: string) {
  const clean = text.replace(/\u0000/g, "").replace(/\/(?:[^/\s]+\/)+main\.cpp/g, "main.cpp");
  if (clean.length <= MAX_OUTPUT) return clean;
  return `${clean.slice(0, MAX_OUTPUT)}\n…output truncated`;
}

let pending: Promise<Sandbox> | null = null;

async function toolchain() {
  if (!pending) {
    pending = (async () => {
      const sandbox = await Sandbox.getOrCreate({
        name: "kindling-cpp",
        timeout: 300_000,
        networkPolicy: "allow-all",
        resources: { vcpus: 2 },
        onCreate: async (created) => {
          const install = await created.runCommand({
            cmd: "bash",
            args: ["-c", "apt-get update && apt-get install -y g++"],
            sudo: true,
          });
          if (install.exitCode !== 0) throw new Error(clip(await install.stderr()));
          await created.update({ networkPolicy: "deny-all" });
        },
      });
      const check = await sandbox.runCommand("g++", ["--version"]);
      if (check.exitCode !== 0) {
        await sandbox.update({ networkPolicy: "allow-all" });
        const install = await sandbox.runCommand({
          cmd: "bash",
          args: ["-c", "apt-get update && apt-get install -y g++"],
          sudo: true,
        });
        await sandbox.update({ networkPolicy: "deny-all" });
        if (install.exitCode !== 0) throw new Error(clip(await install.stderr()));
      } else {
        await sandbox.update({ networkPolicy: "deny-all" });
      }
      return sandbox;
    })().catch((error: unknown) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

/** One student, one home directory, then the account is removed. The toolchain VM has no network. */
export async function runCppInSandbox(code: string, stdin: string): Promise<CppResult> {
  const sandbox = await toolchain();
  const username = `k${randomBytes(6).toString("hex")}`;
  const user = await sandbox.createUser(username);
  try {
    await user.writeFiles([
      { path: "main.cpp", content: Buffer.from(code) },
      { path: "stdin.txt", content: Buffer.from(stdin) },
    ]);
    const compiled = await user.runCommand({
      cmd: "g++",
      args: ["-std=c++20", "-O1", "-Wall", "-Wextra", "-fno-diagnostics-color", "-o", "prog", "main.cpp"],
      cwd: user.homeDir,
      env: { PATH: "/usr/bin:/bin" },
    });
    if (compiled.exitCode !== 0) {
      return { stdout: "", error: clip((await compiled.stderr()) || (await compiled.stdout()) || "The program did not compile.") };
    }
    const ran = await user.runCommand({
      cmd: "bash",
      args: [
        "-c",
        "env -i PATH=/usr/bin:/bin timeout --signal=KILL 2 prlimit --as=268435456 --nproc=64 --fsize=1048576 -- ./prog < stdin.txt",
      ],
      cwd: user.homeDir,
    });
    const stdout = clip(await ran.stdout());
    const stderr = clip(await ran.stderr());
    if (ran.exitCode === 124 || ran.exitCode === 137) {
      return { stdout, error: "The program ran too long and was stopped." };
    }
    if (ran.exitCode !== 0) return { stdout: "", error: stderr || stdout || "The program stopped." };
    return { stdout };
  } finally {
    await sandbox.runCommand({ cmd: "userdel", args: ["-r", username], sudo: true });
  }
}
