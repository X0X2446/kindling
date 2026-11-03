export type Lang = "java" | "cpp" | "csharp" | "kotlin" | "swift" | "dart";

export type WidgetNode =
  | { type: "column" | "row"; children: WidgetNode[] }
  | { type: "text"; text: string }
  | { type: "button"; text: string }
  | { type: "field"; text: string; placeholder?: string }
  | { type: "window"; title: string; children: WidgetNode[] };

export type RunResult = {
  stdout: string;
  error?: string;
  widgets: WidgetNode | null;
};

type Tok = { t: "id" | "num" | "str" | "op" | "punct"; v: string; line: number; template?: boolean };

type Expr =
  | { k: "num"; v: number; int: boolean; line: number }
  | { k: "str"; v: string; template: boolean; line: number }
  | { k: "name"; v: string; line: number }
  | { k: "bool"; v: boolean; line: number }
  | { k: "nil"; line: number }
  | { k: "list"; items: Expr[]; line: number }
  | { k: "unary"; op: string; x: Expr; line: number }
  | { k: "binop"; op: string; l: Expr; r: Expr; line: number }
  | { k: "call"; callee: Expr; args: { label: string | null; value: Expr }[]; line: number }
  | { k: "member"; object: Expr; name: string; line: number }
  | { k: "index"; object: Expr; index: Expr; line: number }
  | { k: "scanner"; line: number };

type Stmt =
  | { k: "block"; body: Stmt[]; line: number }
  | { k: "expr"; expr: Expr; line: number }
  | { k: "decl"; name: string; immutable: boolean; init: Expr | null; keyword: string; line: number }
  | { k: "if"; cond: Expr; then: Stmt; else: Stmt | null; line: number }
  | { k: "while"; cond: Expr; body: Stmt; line: number }
  | { k: "forC"; init: Stmt | null; cond: Expr | null; step: Stmt | null; body: Stmt; line: number }
  | { k: "forIn"; name: string; range: Expr; body: Stmt; line: number }
  | { k: "return"; value: Expr | null; line: number }
  | { k: "func"; name: string; params: string[]; body: Stmt; line: number }
  | { k: "class"; body: Stmt[]; line: number }
  | { k: "cout"; parts: ({ endl: true } | Expr)[]; line: number }
  | { k: "cin"; names: string[]; line: number }
  | { k: "break"; line: number }
  | { k: "continue"; line: number };

class RunError extends Error {
  line?: number;
  constructor(message: string, line?: number) {
    super(line ? `Line ${line}: ${message}` : message);
    this.line = line;
    this.name = "RunError";
  }
}

class Signal {
  constructor(
    public kind: "return" | "break" | "continue",
    public value?: Value,
  ) {}
}

type Value =
  | { k: "int"; v: number }
  | { k: "num"; v: number }
  | { k: "bool"; v: boolean }
  | { k: "str"; v: string }
  | { k: "list"; items: Value[] }
  | { k: "nil" }
  | { k: "scanner" }
  | { k: "widget"; node: WidgetNode }
  | { k: "magic"; name: string };

const NIL: Value = { k: "nil" };
const MODS = new Set(["public", "private", "protected", "static", "final", "const", "override"]);
const PREC: Record<string, number> = {
  "=": 1,
  "+=": : 1,
  "-=": : 1,
  "*=" : 1,
  "/=" : 1,
  "||": : 2,
  "&&" : 3,
  "==" : 4,
  "!=" : 4,
  "<" : 5,
  ">" : 5,
  "<=" : 5,
  ">=" : 5,
  ".." : 6,
  "..." : 6,
  "..<" : 6,
  "+" : 7,
  "-" : 7,
  "*" : 8,
  "/" : 8,
  "%" : 8,
  "~/" : 8,
};
const RIGHT = new Set(["=", "+=", "-=", "*=", "/="]);
const OPS = ["..<", "...", "..", "->", "::", "~/", "==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "<<", ">>", "+", "-", "*", "/", "%", "=", "<", ">", "!"];

class P {
  i = 0;
  constructor(
    public toks: Tok[],
    public lang: Lang,
  ) {}
  get cur() {
    return this.toks[this.i];
  }
  get end() {
    return this.i >= this.toks.length;
  }
  is(v: string) {
    return this.cur?.v === v;
  }
  isId(v?: string) {
    return this.cur?.t === "id" && (v === undefined || this.cur.v === v);
  }
  isOp(v: string) {
    return this.cur?.t === "op" && this.cur.v === v;
  }
  eat(v: string) {
    if (!this.is(v)) throw this.err(`Expected "${v}"`);
    return this.toks[this.i++];
  }
  eatId(v?: string) {
    if (!this.isId(v)) throw this.err(v ? `Expected ${v}` : "Expected a name");
    return this.toks[this.i++];
  }
  err(msg: string) {
    return new RunError(msg, this.cur?.line ?? this.toks.at(-1)?.line ?? 1);
  }
}

function lex(src: string, lang: Lang): Tok[] {
  const s = src.replace(/\r\n/g, "\n");
  const out: Tok[] = [];
  let i = 0;
  let line = 1;
  let paren = 0;
  let bracket = 0;
  const asi = lang === "kotlin" || lang === "swift";
  const pushSemi = (ln: number) => {
    if (out.at(-1)?.v !== ";") out.push({ t: "punct", v: ";", line: ln });
  };
  while (i < s.length) {
    const c = s[i];
    if (c === "\n") {
      line++;
      i++;
      if (asi && paren === 0 && bracket === 0) {
        const prev = out.at(-1);
        const rest = s.slice(i).match(/^\s*/)?.[0] ?? "";
        const n = s[i + rest.length];
        const prevEnd = prev && (prev.t === "id" || prev.t === "num" || prev.t === "str" || prev.v === ")" || prev.v === "]" || prev.v === "++" || prev.v === "--");
        const nextBad = !n || "{}.,)]".includes(n) || n === "+" || n === "-" || n === "*" || n === "/" || n === "%" || n === "=" || n === "!" || n === "<" || n === ">" || n === "&" || n === "|" || n === "?" || n === ":";
        const two = s.slice(i + rest.length, i + rest.length + 2);
        if (prevEnd && !nextBad && two !== "->") {
          const word = s.slice(i + rest.length).match(/^[A-Za-z_]+/)?.[0];
          if (word !== "else") pushSemi(line - 1);
        }
      }
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") {
      i++;
      continue;
    }
    if (c === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && s[i + 1] === "*") {
      i += 2;
      while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) {
        if (s[i] === "\n") line++;
        i++;
      }
      i += 2;
      continue;
    }
    if (lang === "cpp" && c === "#" && (i === 0 || s[i - 1] === "\n")) {
      while (i < s.length && s[i] !== "\n") i++;
      continue;
    }
    if (c === '"' || ((lang === "dart" || lang === "swift" || lang === "kotlin") && c === "'")) {
      const q = c;
      i++;
      let v = "";
      let template = false;
      while (i < s.length && s[i] !== q) {
        if (s[i] === "\n") line++;
        if (s[i] === "\\") {
          const n = s[i + 1];
          if (lang === "swift" && n === "(") {
            template = true;
            v += "\\(";
            i += 2;
            continue;
          }
          const map: Record<string, string> = { n: "\n", t: "\t", '"': '"', "'": "'", "\\": "\\", $: "$" };
          v += map[n] ?? n ?? "";
          i += 2;
          continue;
        }
        if ((lang === "kotlin" || lang === "dart") && s[i] === "$") template = true;
        if (lang === "swift" && s[i] === "\\" && s[i + 1] === "(") template = true;
        v += s[i++];
      }
      if (s[i] !== q) throw new RunError("This string never closes", line);
      i++;
      out.push({ t: "str", v, line, template });
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      if (s[j] === "." && /[0-9]/.test(s[j + 1] ?? "")) {
        j++;
        while (j < s.length && /[0-9]/.test(s[j])) j++;
      }
      out.push({ t: "num", v: s.slice(i, j), line });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
      out.push({ t: "id", v: s.slice(i, j), line });
      i = j;
      continue;
    }
    const three = s.slice(i, i + 3);
    const two = s.slice(i, i + 2);
    const op = OPS.find((item) => item === three || item === two || item === c);
    if (op && (op === c || op === two || op === three)) {
      out.push({ t: "op", v: op, line });
      i += op.length;
      continue;
    }
    if ("(){}[];,.:".includes(c)) {
      if (c === "(") paren++;
      if (c === ")") paren = Math.max(0, paren - 1);
      if (c === "[") bracket++;
      if (c === "]") bracket = Math.max(0, bracket - 1);
      out.push({ t: "punct", v: c, line });
      i++;
      continue;
    }
    throw new RunError(`I don't recognize "${c}"`, line);
  }
  return out;
}

function parse(lang: Lang, toks: Tok[]): Stmt[] {
  const p = new P(toks, lang);
  const body: Stmt[] = [];
  while (!p.end) {
    if (p.is(";")) {
      p.i++;
      continue;
    }
    if (p.isId("import") || p.isId("package") || p.isId("using")) {
      while (!p.end && !p.is(";")) p.i++;
      if (p.is(";")) p.i++;
      continue;
    }
    body.push(parseStmt(p));
  }
  return body;
}

function parseStmt(p: P): Stmt {
  if (p.is("{")) return parseBlock(p);
  if (p.isId("if")) return parseIf(p);
  if (p.isId("while")) return parseWhile(p);
  if (p.isId("for")) return parseFor(p);
  if (p.isId("return")) return parseReturn(p);
  if (p.isId("break")) {
    const line = p.eatId().line;
    expectSemi(p);
    return { k: "break", line };
  }
  if (p.isId("continue")) {
    const line = p.eatId().line;
    expectSemi(p);
    return { k: "continue", line };
  }
  if (p.isId("fun")) return parseKotlinFun(p);
  if (p.isId("func")) return parseSwiftFunc(p);
  if (looksLikeClass(p)) return parseClass(p);
  if (isCout(p)) return parseCout(p);
  if (isCin(p)) return parseCin(p);
  if (looksLikeFunction(p)) return parseCFunction(p);
  if (looksLikeDecl(p)) return parseDecl(p);
  const line = p.cur?.line ?? 1;
  const expr = parseExpr(p);
  expectSemi(p);
  return { k: "expr", expr, line };
}

function parseBlock(p: P): Stmt {
  const line = p.eat("{").line;
  const body: Stmt[] = [];
  while (!p.end && !p.is("}")) {
    if (p.is(";")) {
      p.i++;
      continue;
    }
    body.push(parseStmt(p));
  }
  p.eat("}");
  return { k: "block", body, line };
}

function expectSemi(p: P) {
  if (p.is(";")) {
    p.i++;
    return;
  }
  if ((p.lang === "kotlin" || p.lang === "swift") && (p.is("}") || p.end)) return;
  throw p.err("Add a semicolon at the end of this line");
}

function skipMods(p: P) {
  let immutable = false;
  while (p.cur?.t === "id" && MODS.has(p.cur.v)) {
    if (p.cur.v === "final" || p.cur.v === "const") immutable = true;
    p.i++;
  }
  return immutable;
}

function parseType(p: P) {
  if (p.isId("std")) {
    p.i++;
    p.eat("::");
  }
  if (!p.isId()) throw p.err("Expected a type");
  p.i++;
  while (p.is("[")) {
    p.eat("[");
    p.eat("]");
  }
  if (p.is("<")) {
    let depth = 0;
    do {
      if (p.is("<")) depth++;
      if (p.is(">")) depth--;
      if (p.isOp(">>") && depth >= 2) {
        p.i++;
        depth -= 2;
        continue;
      }
      p.i++;
    } while (depth > 0 && !p.end);
  }
}

function parseIf(p: P): Stmt {
  const line = p.eatId("if").line;
  const cond = parseCond(p);
  const then = parseStmt(p);
  let els: Stmt | null = null;
  if (p.isId("else")) {
    p.i++;
    els = parseStmt(p);
  }
  return { k: "if", cond, then, else: els, line };
}

function parseWhile(p: P): Stmt {
  const line = p.eatId("while").line;
  const cond = parseCond(p);
  const body = parseStmt(p);
  return { k: "while", cond, body, line };
}

function parseCond(p: P): Expr {
  if (p.is("(")) {
    p.eat("(");
    const cond = parseExpr(p);
    p.eat(")");
    return cond;
  }
  return parseExpr(p);
}

function parseFor(p: P): Stmt {
  const line = p.eatId("for").line;
  if (!p.is("(")) {
    const name = p.eatId().v;
    p.eatId("in");
    const range = parseExpr(p);
    const body = parseStmt(p);
    return { k: "forIn", name, range, body, line };
  }
  let depth = 0;
  let semi = false;
  for (let j = p.i; j < p.toks.length; j++) {
    const v = p.toks[j].v;
    if (v === "(") depth++;
    else if (v === ")") {
      depth--;
      if (depth === 0) break;
    } else if (v === ";" && depth === 1) semi = true;
  }
  p.eat("(");
  if (!semi) {
    if (p.isId("val") || p.isId("var") || p.isId("let")) p.i++;
    else if (looksLikeTypedName(p)) parseType(p);
    const name = p.eatId().v;
    p.eatId("in");
    const range = parseExpr(p);
    p.eat(")");
    const body = parseStmt(p);
    return { k: "forIn", name, range, body, line };
  }
  const init = p.is(";") ? (p.i++, null) : parseStmt(p);
  const cond = p.is(";") ? null : parseExpr(p);
  p.eat(";");
  const step = p.is(")")
    ? null
    : { k: "expr" as const, expr: parseExpr(p), line: p.cur?.line ?? line };
  p.eat(")");
  const body = parseStmt(p);
  return { k: "forC", init, cond, step, body, line };
}

function parseReturn(p: P): Stmt {
  const line = p.eatId("return").line;
  if (p.is(";") || ((p.lang === "kotlin" || p.lang === "swift") && (p.is("}") || p.end))) {
    expectSemi(p);
    return { k: "return", value: null, line };
  }
  const value = parseExpr(p);
  expectSemi(p);
  return { k: "return", value, line };
}

function parseKotlinFun(p: P): Stmt {
  const line = p.eatId("fun").line;
  const name = p.eatId().v;
  p.eat("(");
  const params: string[] = [];
  if (!p.is(")")) {
    do {
      const param = p.eatId().v;
      p.eat(":");
      parseType(p);
      params.push(param);
      if (p.is(",")) p.i++;
      else break;
    } while (!p.end);
  }
  p.eat(")");
  if (p.is(":")) {
    p.i++;
    parseType(p);
  }
  const body = parseBlock(p);
  return { k: "func", name, params, body, line };
}

function parseSwiftFunc(p: P): Stmt {
  const line = p.eatId("func").line;
  const name = p.eatId().v;
  p.eat("(");
  const params: string[] = [];
  if (!p.is(")")) {
    do {
      if (p.isId("_")) {
        p.i++;
        params.push(p.eatId().v);
      } else {
        const first = p.eatId().v;
        if (p.isId() && p.toks[p.i + 1]?.v === ":") params.push(p.eatId().v);
        else params.push(first);
      }
      p.eat(":");
      parseType(p);
      if (p.is(",")) p.i++;
      else break;
    } while (!p.end);
  }
  p.eat(")");
  if (p.isOp("->")) {
    p.i++;
    parseType(p);
  }
  const body = parseBlock(p);
  return { k: "func", name, params, body, line };
}

function parseClass(p: P): Stmt {
  const line = p.cur?.line ?? 1;
  skipMods(p);
  p.eatId("class");
  p.eatId();
  p.eat("{");
  const body: Stmt[] = [];
  while (!p.end && !p.is("}")) {
    if (p.is(";")) {
      p.i++;
      continue;
    }
    body.push(parseStmt(p));
  }
  p.eat("}");
  return { k: "class", body, line };
}

function parseCFunction(p: P): Stmt {
  const line = p.cur?.line ?? 1;
  skipMods(p);
  parseType(p);
  const name = p.eatId().v;
  const params = parseCParams(p);
  if (p.isOp("->")) {
    p.i++;
    parseType(p);
  }
  const body = parseBlock(p);
  return { k: "func", name, params, body, line };
}

function parseCParams(p: P) {
  p.eat("(");
  const params: string[] = [];
  if (!p.is(")")) {
    do {
      skipMods(p);
      parseType(p);
      params.push(p.eatId().v);
      if (p.is("[")) {
        p.eat("[");
        p.eat("]");
      }
      if (p.is(",")) p.i++;
      else break;
    } while (!p.end);
  }
  p.eat(")");
  return params;
}

function parseDecl(p: P): Stmt {
  const line = p.cur?.line ?? 1;
  let immutable = skipMods(p);
  let keyword = "";
  if (p.isId("val") || p.isId("let") || p.isId("final")) {
    keyword = p.cur.v;
    immutable = true;
    p.i++;
    if (p.isId() && !p.isId("val") && looksLikeTypeThenName(p)) parseType(p);
  } else if (p.isId("var")) {
    keyword = "var";
    p.i++;
    if (looksLikeTypeThenName(p)) parseType(p);
  } else {
    keyword = p.cur?.v ?? "";
    parseType(p);
  }
  const name = p.eatId().v;
  if (p.is("[")) {
    p.eat("[");
    p.eat("]");
  }
  let init: Expr | null = null;
  if (p.is("=")) {
    p.i++;
    init = parseExpr(p);
  }
  expectSemi(p);
  return { k: "decl", name, immutable, init, keyword, line };
}

function parseCout(p: P): Stmt {
  const line = p.cur?.line ?? 1;
  if (p.isId("std")) p.i += 2;
  p.eatId("cout");
  const parts: ({ endl: true } | Expr)[] = [];
  if (!p.isOp("<<")) throw p.err('cout needs << before a value');
  while (p.isOp("<<")) {
    p.i++;
    if (p.isId("endl") || (p.isId("std") && p.toks[p.i + 1]?.v === "::" && p.toks[p.i + 2]?.v === "endl")) {
      if (p.isId("std")) p.i += 3;
      else p.i++;
      parts.push({ endl: true });
    } else parts.push(parseExpr(p, 7));
  }
  expectSemi(p);
  return { k: "cout", parts, line };
}

function parseCin(p: P): Stmt {
  const line = p.cur?.line ?? 1;
  if (p.isId("std")) p.i += 2;
  p.eatId("cin");
  const names: string[] = [];
  if (!p.isOp(">>")) throw p.err("cin needs >> before a variable");
  while (p.isOp(">>")) {
    p.i++;
    names.push(p.eatId().v);
  }
  expectSemi(p);
  return { k: "cin", names, line };
}

function parseExpr(p: P, min = 0): Expr {
  let left = parseUnary(p);
  while (p.cur?.t === "op" && PREC[p.cur.v] !== undefined && PREC[p.cur.v] >= min) {
    const op = p.toks[p.i++];
    const next = RIGHT.has(op.v) ? PREC[op.v] : PREC[op.v] + 1;
    const right = parseExpr(p, next);
    left = { k: "binop", op: op.v, l: left, r: right, line: op.line };
  }
  return left;
}

function parseUnary(p: P): Expr {
  const t = p.cur;
  if (!t) throw p.err("Expected a value");
  if (t.t === "op" && (t.v === "!" || t.v === "-" || t.v === "++" || t.v === "--")) {
    p.i++;
    return { k: "unary", op: t.v, x: parseUnary(p), line: t.line };
  }
  if (p.isId("new")) return parseNew(p);
  return parsePost(p, parsePrimary(p));
}

function parseNew(p: P): Expr {
  const line = p.eatId("new").line;
  const type = p.eatId().v;
  if (p.is("[")) {
    while (p.is("[") || p.is("]")) p.i++;
    if (p.is("{")) return parseBraceList(p);
  }
  p.eat("(");
  while (!p.end && !p.is(")")) p.i++;
  p.eat(")");
  if (type === "Scanner") return { k: "scanner", line };
  throw p.err(`new ${type} is outside this lesson's runner`);
}

function parsePrimary(p: P): Expr {
  const t = p.cur;
  if (!t) throw p.err("Expected a value");
  if (t.t === "num") {
    p.i++;
    return { k: "num", v: Number(t.v), int: !t.v.includes("."), line: t.line };
  }
  if (t.t === "str") {
    p.i++;
    return { k: "str", v: t.v, template: Boolean(t.template), line: t.line };
  }
  if (t.t === "id" && (t.v === "true" || t.v === "false")) {
    p.i++;
    return { k: "bool", v: t.v === "true", line: t.line };
  }
  if (t.t === "id" && (t.v === "null" || t.v === "nil")) {
    p.i++;
    return { k: "nil", line: t.line };
  }
  if (t.t === "id") {
    p.i++;
    return { k: "name", v: t.v, line: t.line };
  }
  if (t.v === "(") {
    p.i++;
    const e = parseExpr(p);
    p.eat(")");
    return e;
  }
  if (t.v === "[") return parseList(p);
  if (t.v === "{") return parseBraceList(p);
  throw p.err(`I can't read this value ("${t.v}")`);
}

function parseList(p: P): Expr {
  const line = p.eat("[").line;
  const items: Expr[] = [];
  if (!p.is("]")) {
    do {
      items.push(parseExpr(p));
      if (p.is(",")) p.i++;
      else break;
    } while (!p.end);
  }
  p.eat("]");
  return { k: "list", items, line };
}

function parseBraceList(p: P): Expr {
  const line = p.eat("{").line;
  const items: Expr[] = [];
  if (!p.is("}")) {
    do {
      items.push(parseExpr(p));
      if (p.is(",")) p.i++;
      else break;
    } while (!p.end);
  }
  p.eat("}");
  return { k: "list", items, line };
}

function parsePost(p: P, left: Expr): Expr {
  while (!p.end) {
    if (p.is("(")) {
      const line = p.eat("(").line;
      const args: { label: string | null; value: Expr }[] = [];
      if (!p.is(")")) {
        do {
          if (p.isId() && p.toks[p.i + 1]?.v === ":" && p.toks[p.i + 2]?.v !== ":") {
            const label = p.eatId().v;
            p.eat(":");
            args.push({ label, value: parseExpr(p) });
          } else args.push({ label: null, value: parseExpr(p) });
          if (p.is(",")) p.i++;
          else break;
        } while (!p.end);
      }
      p.eat(")");
      left = { k: "call", callee: left, args, line };
      continue;
    }
    if (p.is("[")) {
      const line = p.eat("[").line;
      const index = parseExpr(p);
      p.eat("]");
      left = { k: "index", object: left, index, line };
      continue;
    }
    if (p.is(".")) {
      const line = p.eat(".").line;
      const name = p.eatId().v;
      left = { k: "member", object: left, name, line };
      continue;
    }
    if (p.isOp("++") || p.isOp("--")) {
      const op = p.toks[p.i++];
      left = { k: "unary", op: `post${op.v}`, x: left, line: op.line };
      continue;
    }
    break;
  }
  return left;
}

function lookahead(p: P, fn: (q: P) => boolean) {
  const i = p.i;
  try {
    return fn(p);
  } finally {
    p.i = i;
  }
}

function looksLikeClass(p: P) {
  return lookahead(p, (q) => {
    skipMods(q);
    return q.isId("class");
  });
}

function looksLikeFunction(p: P) {
  return lookahead(p, (q) => {
    skipMods(q);
    if (!q.isId() || q.isId("if") || q.isId("for") || q.isId("while") || q.isId("return") || q.isId("class")) return false;
    if (["val", "var", "let", "fun", "func"].includes(q.cur.v)) return false;
    try {
      parseType(q);
    } catch {
      return false;
    }
    if (!q.isId()) return false;
    q.i++;
    return q.is("(");
  });
}

function looksLikeDecl(p: P) {
  return lookahead(p, (q) => {
    skipMods(q);
    if (!q.isId()) return false;
    if (["fun", "func", "class", "if", "for", "while", "return", "cout", "cin"].includes(q.cur.v)) return false;
    if (q.isId("val") || q.isId("var") || q.isId("let")) {
      q.i++;
      if (looksLikeTypeThenName(q)) parseType(q);
      return q.isId() && (q.toks[q.i + 1]?.v === "=" || q.toks[q.i + 1]?.v === ";" || q.toks[q.i + 1]?.v === ")" || q.toks[q.i + 1]?.v === "[");
    }
    try {
      parseType(q);
    } catch {
      return false;
    }
    if (!q.isId()) return false;
    const next = q.toks[q.i + 1]?.v;
    return next === "=" || next === ";" || next === ")" || next === "[";
  });
}

function looksLikeTypeThenName(p: P) {
  return lookahead(p, (q) => {
    if (!q.isId()) return false;
    if (["val", "var", "let"].includes(q.cur.v)) return false;
    const next = q.toks[q.i + 1]?.v;
    return next !== "=" && next !== ";" && next !== ")" && next !== "in";
  });
}

function looksLikeTypedName(p: P) {
  return looksLikeTypeThenName(p) && p.toks[p.i + 1]?.t === "id";
}

function isCout(p: P) {
  return p.isId("cout") || (p.isId("std") && p.toks[p.i + 1]?.v === "::" && p.toks[p.i + 2]?.v === "cout");
}
function isCin(p: P) {
  return p.isId("cin") || (p.isId("std") && p.toks[p.i + 1]?.v === "::" && p.toks[p.i + 2]?.v === "cin");
}

type Slot = { value: Value; immutable: boolean; keyword: string };
type Func = { params: string[]; body: Stmt; line: number };

export function runInterpreted(lang: Lang, code: string, stdin = ""): RunResult {
  try {
    const program = parse(lang, lex(code, lang));
    const rt = new Runtime(lang, stdin);
    rt.collect(program);
    for (const stmt of program) {
      if (stmt.k === "class" || stmt.k === "func") continue;
      rt.exec(stmt);
    }
    const entry = rt.funcs.get("main") ?? rt.funcs.get("Main");
    if (entry) {
      const args = entry.params.length ? [{ k: "list" as const, items: [] }] : [];
      rt.call(entry, args, entry.line);
    }
    return { stdout: rt.stdout, widgets: rt.widgets };
  } catch (error) {
    if (error instanceof RunError) return { stdout: "", error: error.message, widgets: null };
    return { stdout: "", error: error instanceof Error ? error.message : "The runner stopped.", widgets: null };
  }
}

class Runtime {
  stdout = "";
  widgets: WidgetNode | null = null;
  funcs = new Map<string, Func>();
  private stack: Map<string, Slot>[] = [new Map()];
  private pos = 0;
  private steps = 0;
  constructor(
    private lang: Lang,
    private stdin: string,
  ) {}

  collect(stmts: Stmt[]) {
    for (const stmt of stmts) {
      if (stmt.k === "func") this.funcs.set(stmt.name, { params: stmt.params, body: stmt.body, line: stmt.line });
      else if (stmt.k === "class") this.collect(stmt.body);
    }
  }

  bump(line: number) {
    this.steps++;
    if (this.steps > 250000) throw new RunError("This ran too long. Look for a loop that never ends.", line);
  }

  exec(stmt: Stmt): void {
    this.bump(stmt.line);
    switch (stmt.k) {
      case "block": {
        this.stack.push(new Map());
        try {
          for (const s of stmt.body) this.exec(s);
        } finally {
          this.stack.pop();
        }
        return;
      }
      case "expr":
        this.eval(stmt.expr);
        return;
      case "decl": {
        const value = stmt.init ? this.eval(stmt.init) : NIL;
        this.declare(stmt.name, value, stmt.immutable, stmt.keyword, stmt.line);
        return;
      }
      case "if":
        if (this.truthy(this.eval(stmt.cond), stmt.line)) this.exec(stmt.then);
        else if (stmt.else) this.exec(stmt.else);
        return;
      case "while":
        while (this.truthy(this.eval(stmt.cond), stmt.line)) {
          try {
            this.exec(stmt.body);
          } catch (signal) {
            if (signal instanceof Signal && signal.kind === "break") break;
            if (signal instanceof Signal && signal.kind === "continue") continue;
            throw signal;
          }
        }
        return;
      case "forC": {
        this.stack.push(new Map());
        try {
          if (stmt.init) this.exec(stmt.init);
          while (!stmt.cond || this.truthy(this.eval(stmt.cond), stmt.line)) {
            try {
              this.exec(stmt.body);
            } catch (signal) {
              if (signal instanceof Signal && signal.kind === "break") break;
              if (!(signal instanceof Signal && signal.kind === "continue")) throw signal;
            }
            if (stmt.step) this.exec(stmt.step);
            if (!stmt.cond) break;
          }
        } finally {
          this.stack.pop();
        }
        return;
      }
      case "forIn": {
        this.stack.push(new Map());
        try {
          const runBody = (value: Value) => {
            this.stack.at(-1)!.set(stmt.name, { value, immutable: true, keyword: "let" });
            try {
              this.exec(stmt.body);
            } catch (signal) {
              if (signal instanceof Signal && signal.kind === "break") return false;
              if (signal instanceof Signal && signal.kind === "continue") return true;
              throw signal;
            }
            return true;
          };
          const rangeExpr = stmt.range;
          if (rangeExpr.k === "binop" && (rangeExpr.op === ".." || rangeExpr.op === "..." || rangeExpr.op === "..<")) {
            const bounds = this.eval(rangeExpr);
            if (bounds.k !== "list") throw new RunError("This for-loop needs a range like 1..3", stmt.line);
            const low = this.asInt(bounds.items[0], stmt.line);
            const high = this.asInt(bounds.items[1], stmt.line);
            for (let n = low; n <= high; n++) {
              if (!runBody({ k: "int", v: n })) break;
            }
          } else {
            const range = this.eval(rangeExpr);
            if (range.k !== "list") throw new RunError("This for-loop needs a list or a range", stmt.line);
            for (const item of range.items) {
              if (!runBody(item)) break;
            }
          }
        } finally {
          this.stack.pop();
        }
        return;
      }
      case "return":
        throw new Signal("return", stmt.value ? this.eval(stmt.value) : NIL);
      case "break":
        throw new Signal("break");
      case "continue":
        throw new Signal("continue");
      case "cout":
        for (const part of stmt.parts) {
          if ("endl" in part) this.emit("\n");
          else this.emit(this.format(this.eval(part)));
        }
        return;
      case "cin":
        for (const name of stmt.names) {
          const slot = this.slot(name, stmt.line);
          const kind = slot.keyword.toLowerCase();
          if (kind === "string") this.assign(name, this.readWord(), stmt.line);
          else if (kind === "double" || kind === "float") {
            this.assign(name, { k: "num", v: this.asNumber(this.readWord(), stmt.line) }, stmt.line);
          } else this.assign(name, this.readInt(), stmt.line);
        }
        return;
      case "func":
      case "class":
        return;
    }
  }

  call(fn: Func, args: Value[], line: number) {
    if (args.length !== fn.params.length) {
      throw new RunError(`${fn.params.length === 0 ? "This function takes no values" : `This function takes ${fn.params.length} values`}, but it was given ${args.length}.`, line);
    }
    this.stack.push(new Map());
    try {
      fn.params.forEach((name, index) => this.declare(name, args[index], false, "var", line));
      this.exec(fn.body);
    } catch (signal) {
      if (signal instanceof Signal && signal.kind === "return") return signal.value ?? NIL;
      throw signal;
    } finally {
      this.stack.pop();
    }
    return NIL;
  }

  eval(expr: Expr): Value {
    this.bump(expr.line);
    switch (expr.k) {
      case "num":
        return expr.int ? { k: "int", v: expr.v } : { k: "num", v: expr.v };
      case "str":
        return expr.template ? this.interpolate(expr.v, expr.line) : { k: "str", v: expr.v };
      case "bool":
        return { k: "bool", v: expr.v };
      case "nil":
        return NIL;
      case "scanner":
        return { k: "scanner" };
      case "list":
        return { k: "list", items: expr.items.map((item) => this.eval(item)) };
      case "name":
        if (this.has(expr.v)) return this.lookup(expr.v, expr.line);
        if (["Console", "System", "int", "Integer", "Double", "Math"].includes(expr.v)) return { k: "magic", name: expr.v };
        throw new RunError(`"${expr.v}" has not been created yet`, expr.line);
      case "unary":
        return this.unary(expr.op, expr.x, expr.line);
      case "binop":
        return this.binop(expr.op, expr.l, expr.r, expr.line);
      case "member":
        return this.member(this.eval(expr.object), expr.name, expr.line);
      case "index": {
        const obj = this.eval(expr.object);
        const index = this.asInt(this.eval(expr.index), expr.line);
        if (obj.k === "list") {
          if (index < 0 || index >= obj.items.length) throw new RunError("That index is outside the list", expr.line);
          return obj.items[index];
        }
        if (obj.k === "str") {
          if (index < 0 || index >= obj.v.length) throw new RunError("That index is outside the text", expr.line);
          return { k: "str", v: obj.v[index] };
        }
        throw new RunError("Only lists and text can be indexed", expr.line);
      }
      case "call":
        return this.evalCall(expr);
    }
  }

  evalCall(expr: Extract<Expr, { k: "call" }>): Value {
    const args = expr.args.map((arg) => this.eval(arg.value));
    if (expr.callee.k === "name") return this.callName(expr.callee.v, args, expr.line);
    if (expr.callee.k === "member") {
      const obj = this.eval(expr.callee.object);
      const method = expr.callee.name;
      if (obj.k === "scanner") {
        if (method === "nextInt") return this.readInt();
        if (method === "nextDouble") return { k: "num", v: this.asNumber(this.readWord(), expr.line) };
        if (method === "nextLine") return this.readLine();
      }
      if (obj.k === "magic" && obj.name === "System.out" && (method === "println" || method === "print")) {
        this.emit(args.map((arg) => this.format(arg)).join(" ") + (method === "println" ? "\n" : ""));
        return NIL;
      }
      if (obj.k === "magic" && obj.name === "Console" && (method === "ReadLine" || method === "readLine")) return this.readLine();
      if (obj.k === "magic" && obj.name === "Console" && method === "WriteLine") {
        this.emit(args.map((arg) => this.format(arg)).join(" ") + "\n");
        return NIL;
      }
      if (obj.k === "magic" && (obj.name === "int" || obj.name === "Integer") && (method === "Parse" || method === "parseInt")) {
        return { k: "int", v: this.asInt(args[0], expr.line) };
      }
      if (obj.k === "magic" && obj.name === "Double" && (method === "Parse" || method === "parseDouble")) {
        return { k: "num", v: this.asNumber(args[0], expr.line) };
      }
      if (obj.k === "magic" && obj.name === "Math") return this.math(method, args, expr.line);
      if ((obj.k === "str" || obj.k === "list") && this.isLen(method)) return { k: "int", v: obj.k === "str" ? obj.v.length : obj.items.length };
      throw new RunError(`I can't call ${method} here yet`, expr.line);
    }
    throw new RunError("That can't be called", expr.line);
  }

  callName(name: string, args: Value[], line: number): Value {
    const fn = this.funcs.get(name);
    if (fn) return this.call(fn, args, line);
    if (name === "readInt") return this.readInt();
    if (name === "readln" || name === "readLine") return this.readLine();
    if (name === "contains") {
      return { k: "bool", v: this.format(args[0] ?? NIL).includes(this.format(args[1] ?? NIL)) };
    }
    if (name === "charAt") {
      const text = this.format(args[0] ?? NIL);
      const index = this.asInt(args[1] ?? { k: "int", v: 0 }, line);
      return { k: "str", v: text[index] ?? "" };
    }
    if (name === "pinMode") return NIL;
    if (name === "digitalWrite") {
      this.emit(`pin ${this.format(args[0] ?? NIL)} ${this.format(args[1] ?? NIL)}\n`);
      return NIL;
    }
    if (name === "println") {
      this.emit(args.map((arg) => this.format(arg)).join(" ") + "\n");
      return NIL;
    }
    if (name === "print") {
      const newline = this.lang === "swift" || this.lang === "dart";
      this.emit(args.map((arg) => this.format(arg)).join(" ") + (newline ? "\n" : ""));
      return NIL;
    }
    if (name === "listOf" || name === "arrayOf") return { k: "list", items: args };
    if (name === "abs" || name === "min" || name === "max" || name === "sqrt") return this.math(name, args, line);
    if (["Text", "Label"].includes(name)) return { k: "widget", node: { type: "text", text: args.map((arg) => this.format(arg)).join(" ") } };
    if (name === "Button") return { k: "widget", node: { type: "button", text: args[0] ? this.format(args[0]) : "Button" } };
    if (name === "Field" || name === "TextField") {
      return { k: "widget", node: { type: "field", text: args[0] ? this.format(args[0]) : "", placeholder: args[1] ? this.format(args[1]) : "" } };
    }
    if (["Column", "VStack", "VBox"].includes(name)) return { k: "widget", node: { type: "column", children: this.widgetsOf(args) } };
    if (["Row", "HStack", "HBox"].includes(name)) return { k: "widget", node: { type: "row", children: this.widgetsOf(args) } };
    if (name === "Window" || name === "Screen") {
      const title = args[0]?.k === "str" ? args[0].v : "Preview";
      const rest = args[0]?.k === "str" ? args.slice(1) : args;
      return { k: "widget", node: { type: "window", title, children: this.widgetsOf(rest) } };
    }
    if (name === "runApp" || name === "setContent" || name === "show") {
      const node = this.widgetOf(args[0] ?? NIL, line);
      this.widgets = node.type === "window" ? node : { type: "window", title: "Preview", children: [node] };
      return NIL;
    }
    throw new RunError(`I don't know "${name}" yet. Stay with the syntax from this lesson, or check the spelling.`, line);
  }

  widgetsOf(args: Value[]) {
    return args.flatMap((arg) => (arg.k === "list" ? arg.items.map((item) => this.widgetOf(item, 0)) : [this.widgetOf(arg, 0)]));
  }

  widgetOf(value: Value, line: number): WidgetNode {
    if (value.k === "widget") return value.node;
    if (value.k === "list") return { type: "column", children: value.items.map((item) => this.widgetOf(item, line)) };
    if (value.k === "str") return { type: "text", text: value.v };
    throw new RunError("That value is not a widget", line);
  }

  math(method: string, args: Value[], line: number): Value {
    const nums = args.map((arg) => this.asNumber(arg, line));
    if (method === "abs") return this.numLike(args[0], Math.abs(nums[0]));
    if (method === "min") return this.numLike(args[0], Math.min(...nums));
    if (method === "max") return this.numLike(args[0], Math.max(...nums));
    if (method === "sqrt") return { k: "num", v: Math.sqrt(nums[0]) };
    throw new RunError(`I can't use Math.${method} yet`, line);
  }

  member(obj: Value, name: string, line: number): Value {
    if ((obj.k === "str" || obj.k === "list") && this.isLen(name)) {
      return { k: "int", v: obj.k === "str" ? obj.v.length : obj.items.length };
    }
    if (obj.k === "magic") return { k: "magic", name: `${obj.name}.${name}` };
    throw new RunError(`"${name}" isn't available on that value`, line);
  }

  unary(op: string, expr: Expr, line: number): Value {
    if (op === "!") return { k: "bool", v: !this.truthy(this.eval(expr), line) };
    if (op === "-") {
      const value = this.eval(expr);
      return this.numLike(value, -this.asNumber(value, line));
    }
    if (op === "++" || op === "--" || op === "post++" || op === "post--") {
      if (expr.k !== "name") throw new RunError("++ and -- need a variable", line);
      const current = this.asNumber(this.lookup(expr.v, line), line);
      const next = current + (op.includes("--") ? -1 : 1);
      const value: Value = { k: "int", v: next };
      this.assign(expr.v, value, line);
      return op.startsWith("post") ? { k: "int", v: current } : value;
    }
    throw new RunError(`I can't use ${op} yet`, line);
  }

  binop(op: string, l: Expr, r: Expr, line: number): Value {
    if (op === "&&") return { k: "bool", v: this.truthy(this.eval(l), line) && this.truthy(this.eval(r), line) };
    if (op === "||") return { k: "bool", v: this.truthy(this.eval(l), line) || this.truthy(this.eval(r), line) };
    if (op === "=" || op === "+=" || op === "-=" || op === "*=" || op === "/=") {
      const right = this.eval(r);
      if (l.k === "index") {
        const target = this.eval(l.object);
        if (target.k !== "list") throw new RunError("Only a list can be updated by index", line);
        const index = this.asInt(this.eval(l.index), line);
        if (index < 0 || index >= target.items.length) throw new RunError("That index is outside the list", line);
        const value = op === "=" ? right : this.numericOp(op[0], target.items[index], right, line);
        target.items[index] = value;
        return value;
      }
      if (l.k !== "name") throw new RunError("The left side of an assignment needs to be a variable", line);
      const value = op === "=" ? right : this.numericOp(op[0], this.lookup(l.v, line), right, line);
      this.assign(l.v, value, line);
      return value;
    }
    if (op === ".." || op === "..." || op === "..<") {
      const left = this.eval(l);
      const right = this.eval(r);
      const high = op === "..<" ? this.asInt(right, line) - 1 : this.asInt(right, line);
      return { k: "list", items: [{ k: "int", v: this.asInt(left, line) }, { k: "int", v: high }] };
    }
    const left = this.eval(l);
    const right = this.eval(r);
    if (op === "+") {
      if (left.k === "str" || right.k === "str") return { k: "str", v: this.format(left) + this.format(right) };
      return this.numericOp("+", left, right, line);
    }
    if (["-", "*", "/", "%", "~/"].includes(op)) return this.numericOp(op, left, right, line);
    if (["==", "!=", "<", ">", "<=", ">="].includes(op)) return { k: "bool", v: this.compare(op, left, right, line) };
    throw new RunError(`I can't use ${op} yet`, line);
  }

  numericOp(op: string, left: Value, right: Value, line: number): Value {
    const a = this.asNumber(left, line);
    const b = this.asNumber(right, line);
    const ints = left.k === "int" && right.k === "int";
    let v = 0;
    if (op === "+") v = a + b;
    else if (op === "-") v = a - b;
    else if (op === "*") v = a * b;
    else if (op === "/") {
      if (b === 0) throw new RunError("Division by zero", line);
      if (this.lang === "dart") return { k: "num", v: a / b };
      v = ints ? Math.trunc(a / b) : a / b;
    } else if (op === "~/") {
      if (b === 0) throw new RunError("Division by zero", line);
      v = Math.trunc(a / b);
      return { k: "int", v };
    } else if (op === "%") {
      if (b === 0) throw new RunError("Division by zero", line);
      v = a % b;
    }
    if (ints && op !== "/") return { k: "int", v };
    if (ints && Number.isInteger(v)) return { k: "int", v };
    return { k: "num", v };
  }

  compare(op: string, left: Value, right: Value, line: number): boolean {
    if (op === "==" || op === "!=") {
      const same = this.same(left, right);
      return op === "==" ? same : !same;
    }
    const a = this.asNumber(left, line);
    const b = this.asNumber(right, line);
    if (op === "<") return a < b;
    if (op === ">") return a > b;
    if (op === "<=") return a <= b;
    return a >= b;
  }

  same(a: Value, b: Value) {
    if (a.k === "nil" || b.k === "nil") return a.k === b.k;
    if ((a.k === "int" || a.k === "num") && (b.k === "int" || b.k === "num")) return a.v === b.v;
    if (a.k === "str" && b.k === "str") return a.v === b.v;
    if (a.k === "bool" && b.k === "bool") return a.v === b.v;
    return false;
  }

  interpolate(raw: string, line: number): Value {
    let out = "";
    for (let i = 0; i < raw.length; i++) {
      if ((this.lang === "kotlin" || this.lang === "dart") && raw[i] === "$") {
        if (raw[i + 1] === "{") {
          const end = raw.indexOf("}", i + 2);
          if (end < 0) throw new RunError("This template is missing }", line);
          out += this.format(this.eval(parseExpr(new P(lex(raw.slice(i + 2, end), this.lang), this.lang))));
          i = end;
          continue;
        }
        const name = raw.slice(i + 1).match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0];
        if (name) {
          out += this.format(this.lookup(name, line));
          i += name.length;
          continue;
        }
      }
      if (this.lang === "swift" && raw[i] === "\\" && raw[i + 1] === "(") {
        const end = raw.indexOf(")", i + 2);
        if (end < 0) throw new RunError("This interpolation is missing )", line);
        out += this.format(this.eval(parseExpr(new P(lex(raw.slice(i + 2, end), this.lang), this.lang))));
        i = end;
        continue;
      }
      out += raw[i];
    }
    return { k: "str", v: out };
  }

  declare(name: string, value: Value, immutable: boolean, keyword: string, line: number) {
    const top = this.stack[this.stack.length - 1];
    if (top.has(name)) throw new RunError(`"${name}" is already declared in this block`, line);
    top.set(name, { value, immutable, keyword });
  }

  assign(name: string, value: Value, line: number) {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const slot = this.stack[i].get(name);
      if (!slot) continue;
      if (slot.immutable) {
        const word = slot.keyword === "let" || slot.keyword === "val" || slot.keyword === "final" ? slot.keyword : "a fixed binding";
        throw new RunError(`"${name}" was declared with ${word}, so it cannot change`, line);
      }
      slot.value = value;
      return;
    }
    throw new RunError(`"${name}" has not been created yet`, line);
  }

  has(name: string) {
    return this.stack.some((scope) => scope.has(name));
  }

  slot(name: string, line: number): Slot {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const found = this.stack[i].get(name);
      if (found) return found;
    }
    throw new RunError(`"${name}" has not been created yet`, line);
  }

  lookup(name: string, line: number) {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const slot = this.stack[i].get(name);
      if (slot) {
        if (slot.value.k === "nil") throw new RunError(`"${name}" has been declared but not given a value`, line);
        return slot.value;
      }
    }
    throw new RunError(`"${name}" has not been created yet`, line);
  }

  truthy(value: Value, line: number) {
    if (value.k === "bool") return value.v;
    if (value.k === "int" || value.k === "num") return value.v !== 0;
    throw new RunError("This condition needs a comparison or a boolean", line);
  }

  asNumber(value: Value, line: number) {
    if (value.k === "int" || value.k === "num") return value.v;
    if (value.k === "str" && value.v.trim() !== "" && !Number.isNaN(Number(value.v))) return Number(value.v);
    throw new RunError("This needs a number", line);
  }

  asInt(value: Value, line: number) {
    const n = this.asNumber(value, line);
    if (!Number.isInteger(n)) throw new RunError("This needs a whole number", line);
    return n;
  }

  numLike(sample: Value | undefined, v: number): Value {
    if (sample?.k === "int" && Number.isInteger(v)) return { k: "int", v };
    return { k: "num", v };
  }

  isLen(name: string) {
    return name === "length" || name === "Length" || name === "count" || name === "size";
  }

  format(value: Value): string {
    if (value.k === "int") return String(value.v);
    if (value.k === "num") {
      if (Number.isInteger(value.v)) return String(value.v);
      const rounded = Math.round(value.v * 10000) / 10000;
      return String(rounded);
    }
    if (value.k === "bool") {
      if (this.lang === "cpp") return value.v ? "1" : "0";
      return value.v ? "true" : "false";
    }
    if (value.k === "str") return value.v;
    if (value.k === "nil") return this.lang === "swift" ? "nil" : "null";
    if (value.k === "list") return `[${value.items.map((item) => this.format(item)).join(", ")}]`;
    return "";
  }

  emit(text: string) {
    this.stdout += text;
    if (this.stdout.length > 20000) throw new RunError("The output got too long. Check for a loop that prints forever.");
  }

  readInt(): Value {
    this.skipWs();
    const match = this.stdin.slice(this.pos).match(/^[+-]?\d+/);
    if (!match) throw new RunError("Expected a whole number from input");
    this.pos += match[0].length;
    return { k: "int", v: Number(match[0]) };
  }

  readWord(): Value {
    this.skipWs();
    const match = this.stdin.slice(this.pos).match(/^\S+/);
    if (!match) throw new RunError("Expected text from input");
    this.pos += match[0].length;
    return { k: "str", v: match[0] };
  }

  readLine(): Value {
    if (this.stdin[this.pos] === "\n") this.pos++;
    const end = this.stdin.indexOf("\n", this.pos);
    const cut = end < 0 ? this.stdin.length : end;
    const text = this.stdin.slice(this.pos, cut);
    this.pos = cut + (end < 0 ? 0 : 1);
    return { k: "str", v: text };
  }

  skipWs() {
    while (this.pos < this.stdin.length && /\s/.test(this.stdin[this.pos])) this.pos++;
  }
}
