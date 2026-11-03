type Frame = { vars: Map<string, string> };
type Fn = { start: number; end: number };

class BashReturn extends Error {}

function expand(text: string, frame: Frame): string {
  return text.replace(/\$\{#([A-Za-z_][A-Za-z0-9_]*)\}|\$\(\(\s*([^)]+?)\s*\)\)|\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([0-9]+)|\$([A-Za-z_][A-Za-z0-9_]*)/g, (full, hash: string, math: string, braced: string, digit: string, plain: string) => {
    if (hash) return String((frame.vars.get(hash) ?? "").length);
    if (math) return String(arith(math, frame));
    const name = braced || digit || plain;
    return frame.vars.get(name) ?? "";
  });
}

function arith(expr: string, frame: Frame) {
  const expanded = expr.replace(/\$/g, "").replace(/[A-Za-z_][A-Za-z0-9_]*/g, (name) => frame.vars.get(name) ?? "0");
  const cleaned = expanded.replace(/[^0-9+\-*/%() ]/g, "");
  if (!/^[\d+\-*/%() ]+$/.test(cleaned)) throw new Error("That arithmetic is outside this lesson");
  const value = Function(`"use strict"; return (${cleaned || 0})`)() as number;
  if (!Number.isFinite(value)) throw new Error("That arithmetic did not finish");
  return Math.trunc(value);
}

function splitWords(line: string) {
  const words: string[] = [];
  let current = "";
  let quote = "";
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = "";
      else current += c;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    if (c === " " || c === "\t") {
      if (current) words.push(current);
      current = "";
      continue;
    }
    current += c;
  }
  if (current) words.push(current);
  return words;
}

function condition(raw: string, frame: Frame) {
  const cond = raw.replace(/;\s*(then|do)$/, "").replace(/^\[\[?/, "").replace(/\]\]?$/, "").trim();
  const words = splitWords(cond).map((word) => expand(word, frame));
  if (words[1] === "=" || words[1] === "==") return words[0] === words[2];
  if (words[1] === "!=") return words[0] !== words[2];
  if (words[1] === "-gt" || words[1] === "-ge" || words[1] === "-lt" || words[1] === "-le" || words[1] === "-eq" || words[1] === "-ne") {
    const a = Number(words[0]);
    const b = Number(words[2]);
    if (words[1] === "-gt") return a > b;
    if (words[1] === "-ge") return a >= b;
    if (words[1] === "-lt") return a < b;
    if (words[1] === "-le") return a <= b;
    if (words[1] === "-eq") return a === b;
    return a !== b;
  }
  throw new Error("This test only compares two values");
}

export function runBash(code: string, stdin = ""): { stdout: string; error?: string } {
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const frame: Frame = { vars: new Map() };
  const funcs = new Map<string, Fn>();
  const input = stdin.split("\n");
  let cursor = 0;
  let stdout = "";
  let steps = 0;
  function bump() {
    steps++;
    if (steps > 20000) throw new Error("This ran too long. Look for a loop that never ends.");
  }
  function runRange(start: number, end: number) {
    let i = start;
    while (i < end) {
      bump();
      const raw = lines[i].trim();
      if (!raw || raw.startsWith("#")) {
        i++;
        continue;
      }
      const fn = raw.match(/^([A-Za-z_][A-Za-z0-9_]*)\(\)\s*\{$/);
      if (fn) {
        let depth = 1;
        let j = i + 1;
        for (; j < end; j++) {
          const probe = lines[j].trim();
          if (probe.endsWith("{")) depth++;
          if (probe === "}") {
            depth--;
            if (depth === 0) break;
          }
        }
        funcs.set(fn[1], { start: i + 1, end: j });
        i = j + 1;
        continue;
      }
      if (raw.startsWith("if ")) {
        let depth = 0;
        let elseAt = -1;
        let fi = -1;
        for (let j = i; j < end; j++) {
          const probe = lines[j].trim();
          if (probe.startsWith("if ")) depth++;
          else if (probe === "fi") {
            depth--;
            if (depth === 0) {
              fi = j;
              break;
            }
          } else if (probe === "else" && depth === 1) elseAt = j;
        }
        if (fi < 0) throw new Error("if needs a matching fi");
        const ok = condition(raw.slice(3), frame);
        if (ok) runRange(i + 1, elseAt < 0 ? fi : elseAt);
        else if (elseAt >= 0) runRange(elseAt + 1, fi);
        i = fi + 1;
        continue;
      }
      if (raw.startsWith("while ")) {
        let depth = 0;
        let done = -1;
        for (let j = i; j < end; j++) {
          const probe = lines[j].trim();
          if ((probe.startsWith("while ") || probe.startsWith("for ")) && probe.endsWith("do")) depth++;
          else if (probe === "done") {
            depth--;
            if (depth === 0) {
              done = j;
              break;
            }
          }
        }
        if (done < 0) throw new Error("while needs done");
        let guard = 0;
        while (condition(raw.slice(6), frame)) {
          guard++;
          if (guard > 10000) throw new Error("This ran too long. Look for a loop that never ends.");
          runRange(i + 1, done);
        }
        i = done + 1;
        continue;
      }
      if (raw.startsWith("for ")) {
        const match = raw.match(/^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+);\s*do$/);
        if (!match) throw new Error("Use for name in a b c; do");
        let depth = 0;
        let done = -1;
        for (let j = i; j < end; j++) {
          const probe = lines[j].trim();
          if ((probe.startsWith("while ") || probe.startsWith("for ")) && probe.endsWith("do")) depth++;
          else if (probe === "done") {
            depth--;
            if (depth === 0) {
              done = j;
              break;
            }
          }
        }
        if (done < 0) throw new Error("for needs done");
        const items = splitWords(match[2]).map((word) => expand(word, frame));
        for (const item of items) {
          frame.vars.set(match[1], item);
          runRange(i + 1, done);
        }
        i = done + 1;
        continue;
      }
      if (raw === "return") throw new BashReturn();
      const assign = raw.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (assign) {
        const rawValue = assign[2].trim().replace(/^["']|["']$/g, "");
        const math = rawValue.match(/^\$\(\(\s*([\s\S]*)\s*\)\)$/);
        frame.vars.set(assign[1], math ? String(arith(math[1], frame)) : expand(rawValue, frame));
        i++;
        continue;
      }
      const words = splitWords(raw).map((word) => expand(word, frame));
      if (words[0] === "echo") {
        stdout += words.slice(1).join(" ") + "\n";
        i++;
        continue;
      }
      if (words[0] === "read") {
        frame.vars.set(words[1] ?? "REPLY", input[cursor++] ?? "");
        i++;
        continue;
      }
      const known = funcs.get(words[0] ?? "");
      if (known) {
        words.slice(1).forEach((arg, index) => frame.vars.set(String(index + 1), arg));
        try {
          runRange(known.start, known.end);
        } catch (error) {
          if (!(error instanceof BashReturn)) throw error;
        }
        i++;
        continue;
      }
      throw new Error(`I don't know the command ${words[0] ?? raw}`);
    }
  }
  try {
    runRange(0, lines.length);
    return { stdout };
  } catch (error) {
    return { stdout, error: error instanceof Error ? error.message : "The shell stopped." };
  }
}
