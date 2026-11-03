import type { Runner } from "@/lib/runtime/types";

export function runnerLabel(runner: Runner, qt = false) {
  if (runner === "python" && qt) return "Runs in your browser · Python, with a Qt preview";
  if (runner === "python") return "Runs in your browser · Python";
  if (runner === "javascript") return "Runs in your browser · JavaScript";
  if (runner === "typescript") return "Runs in your browser · TypeScript, then JavaScript";
  if (runner === "lua") return "Runs in the lesson runner · Lua";
  if (runner === "html") return "Live page preview";
  if (runner === "canvas") return "Runs in your browser · Canvas";
  if (runner === "sql") return "Kindling SQL runner · SELECT, WHERE, COUNT, ORDER BY";
  if (runner === "bash") return "Kindling shell · echo, read, tests, and loops";
  const names: Record<string, string> = {
    java: "Java",
    cpp: "C++",
    c: "C",
    csharp: "C#",
    kotlin: "Kotlin",
    swift: "Swift",
    dart: "Dart",
    go: "Go",
    rust: "Rust",
    php: "PHP",
    ruby: "Ruby",
    r: "R",
  };
  return `Kindling ${names[runner] ?? runner} interpreter · no SDK install`;
}
