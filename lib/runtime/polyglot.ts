type Value = number | string | boolean;

type Expr =
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "name"; v: string }
  | { k: "unary"; op: string; x: Expr }
  | { k: "binop"; op: string; l: Expr; r: Expr }
  | { k: "call"; name: string; args: Expr[] }
  | { k: "index"; object: Expr; index: Expr };

type Stmt =
  | { k: "expr"; expr: Expr }
  | { k: "assign"; name: string; expr: Expr }
  | { k: "if"; cond: Expr; then: Stmt[]; else: Stmt[] }
  | { k: "while"; cond: Expr; body: Stmt[] }
  | { k: "for"; name: string; init: Expr; cond: Expr; step: Expr; body: Stmt[] }
  | { k: "fn"; name: string; params: string[]; body: Stmt[] }
  | { k: "return"; expr: Expr | null };

type Tok = { t: string; v: string };

class FlowError extends Error {}

class ReturnSignal {
  constructor(public value: Value) {}
}

const OPS = ["==", "!=", "<=", ">=", "&&", "||", "<", ">", "+", "-", "*", "/", "%", "=", "."];

function lex(source: string) {
  const tokens: Tok[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "#" || (c === "/" && source[i + 1] === "/")) {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let text = "";
      while (j < source.length && source[j] !== c) {
        text += source[j] === "\\" ? source[++j] : source[j];
        j++;
      }
      tokens.push({ t: "str", v: text });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < source.length && /[0-9]/.test(source[j])) j++;
      tokens.push({ t: "num", v: source.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < source.length && /[A-Za-z0-9_]/.test(source[j])) j++;
      tokens.push({ t: "id", v: source.slice(i, j) });
      i = j;
      continue;
    }
    const two = source.slice(i, i + 2);
    if (OPS.includes(two)) {
      tokens.push({ t: "op", v: two });
      i += 2;
      continue;
    }
    if ("(){}[],;".includes(c) || OPS.includes(c)) {
      tokens.push({ t: c === ";" || c === "," ? "punct" : "op", v: c });
      if (c === ";") tokens[tokens.length - 1].t = "punct";
      i++;
      continue;
    }
    throw new FlowError(`I don't recognize "${c}"`);
  }
  return tokens;
}

class Parser {
  i = 0;
  constructor(public toks: Tok[]) {}
  get cur() {
    return this.toks[this.i];
  }
  eat(value?: string) {
    const tok = this.cur;
    if (!tok || (value && tok.v !== value)) throw new FlowError(`Expected ${value ?? "more code"}`);
    this.i++;
    return tok;
  }
  is(value: string) {
    return this.cur?.v === value;
  }
}

function parse(source: string) {
  const p = new Parser(lex(source));
  return parseBlock(p, false);
}

function parseBlock(p: Parser, braced: boolean): Stmt[] {
  const body: Stmt[] = [];
  if (braced) p.eat("{");
  while (p.cur && (!braced || !p.is("}"))) {
    if (p.cur.t === "punct") {
      p.i++;
      continue;
    }
    body.push(parseStmt(p));
  }
  if (braced) p.eat("}");
  return body;
}

function parseStmt(p: Parser): Stmt {
  if (p.is("fn")) {
    p.eat("fn");
    const name = p.eat().v;
    p.eat("(");
    const params: string[] = [];
    if (!p.is(")")) {
      params.push(p.eat().v);
      while (p.is(",")) {
        p.eat(",");
        if (p.cur?.t === "punct") p.i++;
        params.push(p.eat().v);
      }
    }
    p.eat(")");
    return { k: "fn", name, params, body: parseBlock(p, true) };
  }
  if (p.is("if")) {
    p.eat("if");
    const cond = parseExpr(p);
    const then = parseBlock(p, true);
    let els: Stmt[] = [];
    if (p.is("else")) {
      p.eat("else");
      els = parseBlock(p, true);
    }
    return { k: "if", cond, then, else: els };
  }
  if (p.is("while")) {
    p.eat("while");
    const cond = parseExpr(p);
    return { k: "while", cond, body: parseBlock(p, true) };
  }
  if (p.is("for")) {
    p.eat("for");
    const name = p.eat().v;
    p.eat("=");
    const init = parseExpr(p);
    p.eat(";");
    const cond = parseExpr(p);
    p.eat(";");
    p.eat(name);
    p.eat("=");
    const step = parseExpr(p);
    return { k: "for", name, init, cond, step, body: parseBlock(p, true) };
  }
  if (p.is("return")) {
    p.eat("return");
    if (!p.cur || p.is("}") || p.cur.t === "punct") return { k: "return", expr: null };
    return { k: "return", expr: parseExpr(p) };
  }
  if (p.cur?.t === "id" && p.toks[p.i + 1]?.v === "=") {
    const name = p.eat().v;
    p.eat("=");
    return { k: "assign", name, expr: parseExpr(p) };
  }
  return { k: "expr", expr: parseExpr(p) };
}

function parseExpr(p: Parser) {
  return parseBinary(p, 0);
}

const PREC: Record<string, number> = { "||": 1, "&&": 2, "==": 3, "!=": 3, "<": 4, ">": 4, "<=": 4, ">=": 4, "+": 5, "-": 5, ".": 5, "*": 6, "/": 6, "%": 6 };

function parseBinary(p: Parser, min: number): Expr {
  let left = parseUnary(p);
  while (p.cur?.t === "op" && PREC[p.cur.v] !== undefined && PREC[p.cur.v] >= min) {
    const op = p.eat().v;
    const right = parseBinary(p, PREC[op] + 1);
    left = { k: "binop", op, l: left, r: right };
  }
  return left;
}

function parseUnary(p: Parser): Expr {
  if (p.is("-") || p.is("!")) {
    const op = p.eat().v;
    return { k: "unary", op, x: parseUnary(p) };
  }
  return parsePrimary(p);
}

function parsePrimary(p: Parser): Expr {
  const tok = p.cur;
  if (!tok) throw new FlowError("The expression ended early");
  let expr: Expr;
  if (tok.t === "num") {
    p.i++;
    expr = { k: "num", v: Number(tok.v) };
  } else if (tok.t === "str") {
    p.i++;
    expr = { k: "str", v: tok.v };
  } else if (tok.v === "(") {
    p.eat("(");
    expr = parseExpr(p);
    p.eat(")");
  } else if (tok.t === "id") {
    p.i++;
    if (p.is("(")) {
      p.eat("(");
      const args: Expr[] = [];
      if (!p.is(")")) {
        args.push(parseExpr(p));
        while (p.is(",")) {
          p.eat(",");
          args.push(parseExpr(p));
        }
      }
      p.eat(")");
      expr = { k: "call", name: tok.v, args };
    } else expr = { k: "name", v: tok.v };
  } else throw new FlowError(`I can't read ${tok.v}`);
  while (p.is("[")) {
    p.eat("[");
    const index = parseExpr(p);
    p.eat("]");
    expr = { k: "index", object: expr, index };
  }
  return expr;
}

type Fn = { params: string[]; body: Stmt[] };

function truthy(value: Value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return value !== "";
}

function num(value: Value, label: string) {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new FlowError(`${label} needs a number`);
  return parsed;
}

export function normalizeFlow(lang: "go" | "rust" | "php" | "ruby" | "r", source: string) {
  if (lang === "go") return normalizeGo(source);
  if (lang === "rust") return normalizeRust(source);
  if (lang === "php") return normalizePhp(source);
  if (lang === "ruby") return normalizeRuby(source);
  return normalizeR(source);
}

function normalizeGo(source: string) {
  let code = source
    .replace(/package\s+\w+/g, "")
    .replace(/import\s+(?:\(\s*)?"[^"]+"\s*\)?/g, "")
    .replace(/fmt\.Println\(/g, "print(")
    .replace(/fmt\.Print\(/g, "print(")
    .replace(/fmt\.Scanln\(&([A-Za-z_][A-Za-z0-9_]*)\)/g, "$1 = input()")
    .replace(/fmt\.Scan\(&([A-Za-z_][A-Za-z0-9_]*)\)/g, "$1 = num(input())")
    .replace(/\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s+string\s*=/g, '$1 = "')
    .replace(/\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s+string/g, '$1 = ""')
    .replace(/\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s+\w+\s*=/g, "$1 =")
    .replace(/\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s+\w+/g, "$1 = 0")
    .replace(/:=/g, "=");
  code = code.replace(/func\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)[^{]*/g, (_, name: string, params: string) => {
    const names = params
      .split(",")
      .map((part) => part.trim().split(/\s+/)[0])
      .filter(Boolean);
    return `fn ${name}(${names.join(", ")}) `;
  });
  code = code.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\+\+/g, "$1 = $1 + 1");
  return code;
}

function sliceCall(source: string, name: string, rewrite: (inner: string) => string) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const at = source.indexOf(name, i);
    if (at < 0) {
      out += source.slice(i);
      break;
    }
    let j = at + name.length;
    while (source[j] === " " || source[j] === "\n") j++;
    if (source[j] !== "(") {
      out += source.slice(i, j);
      i = j;
      continue;
    }
    let depth = 0;
    const start = j;
    for (; j < source.length; j++) {
      if (source[j] === "(") depth++;
      else if (source[j] === ")") {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    out += source.slice(i, at) + rewrite(source.slice(start + 1, j - 1));
    i = j;
  }
  return out;
}

function normalizeRust(source: string) {
  let code = source
    .replace(/\blet\s+mut\s+/g, "")
    .replace(/\blet\s+/g, "")
    .replace(/->\s*[A-Za-z0-9_:]+/g, "")
    .replace(/:\s*[A-Za-z_][A-Za-z0-9_]*/g, "")
    .replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\+=\s*1/g, "$1 = $1 + 1");
  code = sliceCall(code, 'println!', (inner) => {
    const comma = inner.indexOf(",");
    const expr = comma >= 0 ? inner.slice(comma + 1).trim() : inner.trim();
    return `print(${expr})`;
  });
  return code.replace(/\bfn\s+/g, "fn ");
}

function normalizePhp(source: string) {
  let code = source.replace(/<\?php/g, "").replace(/\?>/g, "").replace(/\$/g, "");
  code = code.replace(/\bfunction\b/g, "fn");
  code = code.replace(/intval\(trim\(fgets\(STDIN\)\)\)/g, "num(input())");
  code = code.replace(/trim\(fgets\(STDIN\)\)/g, "input()");
  code = code.replace(/\becho\s+/g, "print(");
  code = code.replace(/print\((.*)\s*,\s*"\\n"\s*;/g, "print($1);");
  return code.replace(/print\(([^;]*);/g, "print($1);");
}

function normalizeRuby(source: string) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("def ")) return line.replace("def ", "fn ") + " {";
      if (trimmed === "end") return line.replace("end", "}");
      if (trimmed === "else") return "} else {";
      if (trimmed.startsWith("if ")) return `${line} {`;
      if (trimmed.startsWith("while ")) return `${line} {`;
      if (trimmed.startsWith("puts ")) return line.replace("puts ", "print(") + ")";
      return line.replaceAll("gets.to_i", "num(input())").replaceAll("gets.chomp", "input()");
    })
    .join("\n");
}

function normalizeR(source: string) {
  let code = source.replace(/([A-Za-z_][A-Za-z0-9_.]*)\s*<-\s*function\s*\(/g, "fn $1(");
  code = code.replace(/<-/g, "=");
  code = code.replace(/as\.integer\(readLines\(\s*n\s*=\s*1\s*\)\)/g, "num(input())");
  code = code.replace(/readLines\(\s*n\s*=\s*1\s*\)/g, "input()");
  return code;
}

export function runFlow(source: string, stdin = ""): { stdout: string; error?: string } {
  try {
    const stmts = parse(source);
    const funcs = new Map<string, Fn>();
    const global = new Map<string, Value>();
    const lines = stdin === "" ? [] : stdin.split("\n");
    let cursor = 0;
    let stdout = "";
    let steps = 0;
    const bump = () => {
      steps++;
      if (steps > 100000) throw new FlowError("This ran too long. Look for a loop that never ends.");
    };
    const lookup = (scope: Map<string, Value>, name: string): Value => {
      if (scope.has(name)) return scope.get(name) as Value;
      if (global.has(name)) return global.get(name) as Value;
      throw new FlowError(`I don't know "${name}" yet`);
    };
    const write = (scope: Map<string, Value>, name: string, value: Value) => {
      if (scope.has(name) || scope === global) scope.set(name, value);
      else if (global.has(name)) global.set(name, value);
      else scope.set(name, value);
    };
    const evalExpr = (expr: Expr, scope: Map<string, Value>): Value => {
      bump();
      if (expr.k === "num") return expr.v;
      if (expr.k === "str") return expr.v;
      if (expr.k === "name") return lookup(scope, expr.v);
      if (expr.k === "unary") {
        const value = num(evalExpr(expr.x, scope), "This");
        if (expr.op === "-") return -value;
        return truthy(evalExpr(expr.x, scope)) ? 0 : 1;
      }
      if (expr.k === "binop") {
        if (expr.op === "&&") return truthy(evalExpr(expr.l, scope)) && truthy(evalExpr(expr.r, scope)) ? 1 : 0;
        if (expr.op === "||") return truthy(evalExpr(expr.l, scope)) || truthy(evalExpr(expr.r, scope)) ? 1 : 0;
        const left = evalExpr(expr.l, scope);
        const right = evalExpr(expr.r, scope);
        if (expr.op === "+" || expr.op === ".") {
          if (expr.op === "." || typeof left === "string" || typeof right === "string") return String(left) + String(right);
          return num(left, "Left") + num(right, "Right");
        }
        if (expr.op === "==") return left === right ? 1 : 0;
        if (expr.op === "!=") return left !== right ? 1 : 0;
        const a = num(left, "Left");
        const b = num(right, "Right");
        if (expr.op === "-") return a - b;
        if (expr.op === "*") return a * b;
        if (expr.op === "/") {
          if (b === 0) throw new FlowError("Division by zero");
          return Math.trunc(a / b);
        }
        if (expr.op === "%") {
          if (b === 0) throw new FlowError("Division by zero");
          return a % b;
        }
        if (expr.op === "<") return a < b ? 1 : 0;
        if (expr.op === ">") return a > b ? 1 : 0;
        if (expr.op === "<=") return a <= b ? 1 : 0;
        if (expr.op === ">=") return a >= b ? 1 : 0;
      }
      if (expr.k === "index") {
        const object = evalExpr(expr.object, scope);
        const index = num(evalExpr(expr.index, scope), "Index");
        if (typeof object !== "string") throw new FlowError("Only text can be indexed here");
        return object[index] ?? "";
      }
      if (expr.k === "call") return call(expr.name, expr.args.map((arg) => evalExpr(arg, scope)), scope);
      throw new FlowError("That expression is outside this lesson");
    };
    const call = (name: string, args: Value[], scope: Map<string, Value>): Value => {
      if (name === "print") {
        stdout += args.map(String).join(" ") + "\n";
        return 0;
      }
      if (name === "input") return lines[cursor++] ?? "";
      if (name === "num") return num(args[0] ?? "", "num");
      if (name === "len") return String(args[0] ?? "").length;
      if (name === "cat") return args.map(String).join("");
      if (name === "contains") return String(args[0] ?? "").includes(String(args[1] ?? "")) ? 1 : 0;
      if (name === "charAt") return String(args[0] ?? "")[num(args[1] ?? 0, "charAt")] ?? "";
      const fn = funcs.get(name);
      if (!fn) throw new FlowError(`I don't know "${name}" yet`);
      const local = new Map<string, Value>();
      fn.params.forEach((param, index) => local.set(param, args[index] ?? 0));
      try {
        exec(fn.body, local);
      } catch (signal) {
        if (signal instanceof ReturnSignal) return signal.value;
        throw signal;
      }
      return 0;
    };
    const exec = (body: Stmt[], scope: Map<string, Value>) => {
      for (const stmt of body) {
        bump();
        if (stmt.k === "fn") {
          funcs.set(stmt.name, { params: stmt.params, body: stmt.body });
          continue;
        }
        if (stmt.k === "assign") {
          write(scope, stmt.name, evalExpr(stmt.expr, scope));
          continue;
        }
        if (stmt.k === "expr") {
          evalExpr(stmt.expr, scope);
          continue;
        }
        if (stmt.k === "return") throw new ReturnSignal(stmt.expr ? evalExpr(stmt.expr, scope) : 0);
        if (stmt.k === "if") {
          exec(truthy(evalExpr(stmt.cond, scope)) ? stmt.then : stmt.else, scope);
          continue;
        }
        if (stmt.k === "while") {
          while (truthy(evalExpr(stmt.cond, scope))) exec(stmt.body, scope);
          continue;
        }
        if (stmt.k !== "for") throw new FlowError("That statement is outside this lesson");
        write(scope, stmt.name, evalExpr(stmt.init, scope));
        while (truthy(evalExpr(stmt.cond, scope))) {
          exec(stmt.body, scope);
          write(scope, stmt.name, evalExpr(stmt.step, scope));
        }
      }
    };
    exec(stmts, global);
    const main = funcs.get("main");
    if (main) call("main", [], global);
    return { stdout };
  } catch (error) {
    return { stdout: "", error: error instanceof Error ? error.message : "The runner stopped." };
  }
}

export function runPolyglot(lang: "go" | "rust" | "php" | "ruby" | "r", code: string, stdin = "") {
  return runFlow(normalizeFlow(lang, code), stdin);
}
