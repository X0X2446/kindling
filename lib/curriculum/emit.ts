export type Lang =
  | "python"
  | "javascript"
  | "typescript"
  | "lua"
  | "java"
  | "cpp"
  | "c"
  | "csharp"
  | "kotlin"
  | "swift"
  | "dart"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "r"
  | "bash";

const SEMI = new Set<Lang>(["java", "cpp", "c", "csharp", "dart"]);

function end(lang: Lang, line: string) {
  if (!SEMI.has(lang)) return line;
  return line
    .split("\n")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed || trimmed.endsWith(";") || trimmed.endsWith("{") || trimmed.endsWith("}") || trimmed.startsWith("//") || trimmed.startsWith("#")) return part;
      return `${part};`;
    })
    .join("\n");
}

function bashPiece(part: string): string {
  if (part.startsWith('"') && part.endsWith('"')) return JSON.parse(part) as string;
  if (part.startsWith("${")) return part;
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(part)) return `$${part}`;
  return `$((${part.replace(/[()\s]/g, "")}))`;
}

function bashMath(expr: string) {
  return `$((${expr.replace(/[()\s]/g, "")}))`;
}

function bashPrint(expr: string) {
  if (expr.startsWith("${") || expr.startsWith('"')) return `echo ${expr}`;
  if (/^[A-Za-z_][A-Za-z0-9_]*(\s+\$?[A-Za-z0-9_"]+)+$/.test(expr) && !/[+\-*/%]/.test(expr)) return expr;
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(expr)) return `echo "$${expr}"`;
  return `echo ${bashMath(expr)}`;
}

function bashAtom(atom: string) {
  const t = atom.trim();
  if (t.startsWith("${") || t.startsWith('"')) return t;
  if (/^-?\d+$/.test(t)) return t;
  if (t.includes("%") || /[+\-*/]/.test(t)) return bashMath(t);
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)) return `"$${t}"`;
  return t;
}

function bashTest(cond: string) {
  const match = cond.match(/^(.*)\s(==|!=|>=|<=|>|<)\s(.*)$/);
  if (!match) return cond;
  const numeric: Record<string, string> = { ">=": "-ge", "<=": "-le", ">": "-gt", "<": "-lt" };
  const op = match[2] === "==" ? "=" : match[2] === "!=" ? "!=" : numeric[match[2]];
  return `${bashAtom(match[1])} ${op} ${bashAtom(match[3])}`;
}

function bashBound(expr: string) {
  if (/^-?\d+$/.test(expr)) return expr;
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(expr)) return `"$${expr}"`;
  return bashMath(expr);
}

function bashAssign(name: string, expr: string) {
  if (/^-?\d+$/.test(expr)) return `${name}=${expr}`;
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(expr)) return `${name}=$${expr}`;
  if (expr.startsWith('"') || expr.startsWith("${")) return `${name}=${expr}`;
  return `${name}=${bashMath(expr)}`;
}

function indent(code: string, spaces: number) {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .filter((line, index, all) => line.length > 0 || (index > 0 && index < all.length - 1))
    .map((line) => (line.length ? pad + line : line))
    .join("\n");
}

export type Emitter = {
  comment: (text: string) => string;
  str: (text: string) => string;
  print: (expr: string) => string;
  readNum: (name: string) => string;
  readStr: (name: string) => string;
  assign: (name: string, expr: string) => string;
  set: (name: string, expr: string) => string;
  ret: (expr: string) => string;
  call: (name: string, args: { name: string; expr: string }[]) => string;
  iff: (cond: string, thenBody: string, elseBody?: string) => string;
  forRange: (name: string, from: string, to: string, body: string) => string;
  fn: (name: string, params: string[], body: string) => string;
  program: (body: string[], functions?: string) => string;
  contains: (hay: string, needle: string) => string;
  concat: (left: string, right: string) => string;
  len: (expr: string) => string;
  div: (left: string, right: string) => string;
};

function braceIf(cond: string, thenBody: string, elseBody: string | undefined, condWrap: (cond: string) => string) {
  const then = `{\n${indent(thenBody, 2)}\n}`;
  const els = elseBody ? ` else {\n${indent(elseBody, 2)}\n}` : "";
  return `${condWrap(cond)} ${then}${els}`;
}

function braceFor(name: string, from: string, to: string, body: string, header: string) {
  return `${header} {\n${indent(body, 2)}\n}`;
}

export function emitter(lang: Lang): Emitter {
  const comment = (text: string) => (lang === "python" || lang === "ruby" || lang === "r" || lang === "bash" ? `# ${text}` : lang === "lua" ? `-- ${text}` : `// ${text}`);
  const str = (text: string) => JSON.stringify(text);
  const div = (left: string, right: string) => {
    if (lang === "python") return `(${left}) // (${right})`;
    if (lang === "dart") return `(${left}) ~/ (${right})`;
    if (lang === "javascript" || lang === "typescript") return `Math.trunc((${left}) / (${right}))`;
    if (lang === "lua") return `math.floor((${left}) / (${right}))`;
    return `(${left}) / (${right})`;
  };
  const len = (expr: string) => {
    if (lang === "python") return `len(${expr})`;
    if (lang === "javascript" || lang === "typescript") return `${expr}.length`;
    if (lang === "lua") return `string.len(${expr})`;
    if (lang === "csharp") return `${expr}.Length`;
    if (lang === "swift") return `${expr}.count`;
    if (lang === "php") return `len($${expr})`;
    if (lang === "bash") return `\${#${expr}}`;
    if (lang === "go" || lang === "rust" || lang === "ruby" || lang === "r") return `len(${expr})`;
    return `${expr}.length`;
  };
  const concat = (left: string, right: string) => {
    if (lang === "lua") return `(${left} .. ${right})`;
    if (lang === "php") return `(${left} . ${right})`;
    if (lang === "r") return `cat(${left}, ${right})`;
    if (lang === "python") return `(str(${left}) + str(${right}))`;
    if (lang === "bash") return `"${bashPiece(left)}${bashPiece(right)}"`;
    return `(${left} + ${right})`;
  };
  const contains = (hay: string, needle: string) => {
    if (lang === "python") return `(${needle} in ${hay})`;
    if (lang === "javascript" || lang === "typescript") return `${hay}.includes(${needle})`;
    if (lang === "lua") return `(string.find(${hay}, ${needle}, 1, true) ~= nil)`;
    if (lang === "php") return `contains($${hay}, ${needle})`;
    return `contains(${hay}, ${needle})`;
  };
  const print = (expr: string) => {
    if (lang === "python") return `print(${expr})`;
    if (lang === "javascript" || lang === "typescript") return `console.log(${expr})`;
    if (lang === "ruby") return `puts ${expr}`;
    if (lang === "kotlin") return `println(${expr})`;
    if (lang === "bash") return bashPrint(expr);
    if (lang === "lua" || lang === "swift" || lang === "dart") return `print(${expr})`;
    if (lang === "java") return `System.out.println(${expr})`;
    if (lang === "csharp") return `Console.WriteLine(${expr})`;
    if (lang === "cpp") return `cout << ${expr} << endl`;
    if (lang === "c") return `printf("%d\\n", ${expr})`;
    if (lang === "go") return `fmt.Println(${expr})`;
    if (lang === "rust") return `println!("{}", ${expr})`.replace("println(", "println!(");
    if (lang === "php") return `echo ${expr};`;
    if (lang === "r") return `print(${expr})`;
    return `print(${expr})`;
  };
  const printText = (expr: string) => end(lang, lang === "c" ? `printf("%s\\n", ${expr})` : print(expr));
  const readNum = (name: string) => {
    if (lang === "python") return `${name} = int(input())`;
    if (lang === "javascript") return `let ${name} = Number(input())`;
    if (lang === "typescript") return `let ${name}: number = Number(input())`;
    if (lang === "lua") return `local ${name} = tonumber(input())`;
    if (lang === "java") return `int ${name} = input.nextInt()`;
    if (lang === "cpp" || lang === "c") return `int ${name};\n${lang === "c" ? `scanf("%d", &${name})` : `cin >> ${name}`}`;
    if (lang === "csharp") return `int ${name} = int.Parse(Console.ReadLine())`;
    if (lang === "kotlin") return `var ${name} = readInt()`;
    if (lang === "swift") return `var ${name} = readInt()`;
    if (lang === "dart") return `var ${name} = readInt()`;
    if (lang === "go") return `var ${name} int\nfmt.Scan(&${name})`;
    if (lang === "rust") return `let mut ${name} = num(input())`;
    if (lang === "php") return `$${name} = intval(trim(fgets(STDIN)))`;
    if (lang === "ruby") return `${name} = gets.to_i`;
    if (lang === "bash") return `read ${name}`;
    return `${name} <- as.integer(readLines(n = 1))`;
  };
  const readNumEnded = (name: string) => end(lang, readNum(name));
  const readStr = (name: string) => {
    if (lang === "python") return `${name} = input()`;
    if (lang === "javascript") return `let ${name} = input()`;
    if (lang === "typescript") return `let ${name}: string = input()`;
    if (lang === "lua") return `local ${name} = input()`;
    if (lang === "java") return `String ${name} = input.nextLine()`;
    if (lang === "cpp") return `string ${name};\ncin >> ${name}`;
    if (lang === "c") return `char ${name}[64];\nscanf("%s", ${name})`;
    if (lang === "csharp") return `string ${name} = Console.ReadLine()`;
    if (lang === "kotlin") return `var ${name} = readln()`;
    if (lang === "swift") return `var ${name} = readLine()`;
    if (lang === "dart") return `var ${name} = readLine()`;
    if (lang === "go") return `var ${name} string\nfmt.Scanln(&${name})`;
    if (lang === "rust") return `let mut ${name} = input()`;
    if (lang === "php") return `$${name} = trim(fgets(STDIN))`;
    if (lang === "ruby") return `${name} = gets.chomp`;
    if (lang === "bash") return `read ${name}`;
    return `${name} <- readLines(n = 1)`;
  };
  const assign = (name: string, expr: string) => {
    if (lang === "javascript") return `let ${name} = ${expr}`;
    if (lang === "typescript") return `let ${name}: number = ${expr}`;
    if (lang === "lua") return `local ${name} = ${expr}`;
    if (lang === "java" || lang === "cpp" || lang === "c" || lang === "csharp" || lang === "dart") return `int ${name} = ${expr}`;
    if (lang === "kotlin") return `var ${name} = ${expr}`;
    if (lang === "swift") return `var ${name} = ${expr}`;
    if (lang === "go") return `${name} := ${expr}`;
    if (lang === "rust") return `let mut ${name} = ${expr}`;
    if (lang === "php") return `$${name} = ${expr}`;
    if (lang === "r") return `${name} <- ${expr}`;
    if (lang === "bash") return bashAssign(name, expr);
    return `${name} = ${expr}`;
  };
  const set = (name: string, expr: string) => {
    if (lang === "php") return `$${name} = ${expr}`;
    if (lang === "r") return `${name} <- ${expr}`;
    if (lang === "bash") return bashAssign(name, expr);
    return `${name} = ${expr}`;
  };
  const ret = (expr: string) => {
    if (lang === "bash") return `${bashPrint(expr)}\nreturn`;
    if (lang === "python" || lang === "ruby") return `return ${expr}`;
    if (lang === "lua") return `return ${expr}`;
    if (lang === "r") return `return(${expr})`;
    return `return ${expr}`;
  };
  const call = (name: string, args: { name: string; expr: string }[]) => {
    if (lang === "bash") return `${name}${args.map((arg) => ` $${arg.expr}`).join("")}`;
    if (lang === "swift") return `${name}(${args.map((arg) => `${arg.name}: ${arg.expr}`).join(", ")})`;
    return `${name}(${args.map((arg) => arg.expr).join(", ")})`;
  };
  const iff = (cond: string, thenBody: string, elseBody?: string) => {
    if (lang === "bash") {
      const els = elseBody ? `else\n${indent(elseBody, 2)}\n` : "";
      return `if [ ${bashTest(cond)} ]; then\n${indent(thenBody, 2)}\n${els}fi`;
    }
    if (lang === "python") {
      const els = elseBody ? `\nelse:\n${indent(elseBody, 4)}` : "";
      return `if ${cond}:\n${indent(thenBody, 4)}${els}`;
    }
    if (lang === "ruby") {
      const els = elseBody ? `\nelse\n${indent(elseBody, 2)}` : "";
      return `if ${cond}\n${indent(thenBody, 2)}${els}\nend`;
    }
    if (lang === "lua") {
      const els = elseBody ? `\nelse\n${indent(elseBody, 2)}` : "";
      return `if ${cond} then\n${indent(thenBody, 2)}${els}\nend`;
    }
    if (lang === "r") {
      const els = elseBody ? ` else {\n${indent(elseBody, 2)}\n}` : "";
      return `if (${cond}) {\n${indent(thenBody, 2)}\n}${els}`;
    }
    return braceIf(cond, thenBody, elseBody, (value) => `if (${value})`);
  };
  const forRange = (name: string, from: string, to: string, body: string) => {
    if (lang === "bash") {
      return `${name}=${/^-?\d+$/.test(from) ? from : `$${from}`}\nwhile [ "$${name}" -le ${bashBound(to)} ]; do\n${indent(body, 2)}\n${name}=$((${name}+1))\ndone`;
    }
    if (lang === "python") return `for ${name} in range(${from}, (${to}) + 1):\n${indent(body, 4)}`;
    if (lang === "lua") return `for ${name} = ${from}, ${to} do\n${indent(body, 2)}\nend`;
    if (lang === "ruby") return `${name} = ${from}\nwhile ${name} <= ${to}\n${indent(body, 2)}\n${name} = ${name} + 1\nend`;
    if (lang === "r") return `${name} <- ${from}\nwhile (${name} <= ${to}) {\n${indent(body, 2)}\n${name} <- ${name} + 1\n}`;
    if (lang === "kotlin") return braceFor(name, from, to, body, `for (${name} in ${from}..${to})`);
    if (lang === "swift") return braceFor(name, from, to, body, `for ${name} in ${from}...${to}`);
    if (lang === "dart") return braceFor(name, from, to, body, `for (var ${name} = ${from}; ${name} <= ${to}; ${name} = ${name} + 1)`);
    if (lang === "go") return braceFor(name, from, to, body, `for ${name} := ${from}; ${name} <= ${to}; ${name}++`);
    if (lang === "rust") return `let mut ${name} = ${from};\nwhile ${name} <= ${to} {\n${indent(body, 2)}\n${name} = ${name} + 1;\n}`;
    if (lang === "php") return `$${name} = ${from};\nwhile ($${name} <= ${to}) {\n${indent(body, 2)}\n$${name} = $${name} + 1;\n}`;
    if (lang === "csharp") return braceFor(name, from, to, body, `for (int ${name} = ${from}; ${name} <= ${to}; ${name}++)`);
    if (lang === "java" || lang === "cpp" || lang === "c") return braceFor(name, from, to, body, `for (int ${name} = ${from}; ${name} <= ${to}; ${name}++)`);
    return braceFor(name, from, to, body, `for (let ${name} = ${from}; ${name} <= ${to}; ${name}++)`);
  };
  const fn = (name: string, params: string[], body: string) => {
    if (lang === "bash") {
      const bind = params.map((param, index) => `${param}=$${index + 1}`).join("\n");
      return `${name}() {\n${indent(`${bind}\n${body}`, 2)}\n}`;
    }
    if (lang === "python") return `def ${name}(${params.join(", ")}):\n${indent(body, 4)}`;
    if (lang === "javascript") return `function ${name}(${params.join(", ")}) {\n${indent(body, 2)}\n}`;
    if (lang === "typescript") return `function ${name}(${params.map((param) => `${param}: number`).join(", ")}): number {\n${indent(body, 2)}\n}`;
    if (lang === "lua") return `local function ${name}(${params.join(", ")})\n${indent(body, 2)}\nend`;
    if (lang === "java" || lang === "c" || lang === "cpp") return `static int ${name}(${params.map((param) => `int ${param}`).join(", ")}) {\n${indent(body, 2)}\n}`;
    if (lang === "csharp") return `static int ${name}(${params.map((param) => `int ${param}`).join(", ")}) {\n${indent(body, 2)}\n}`;
    if (lang === "kotlin") return `fun ${name}(${params.map((param) => `${param}: Int`).join(", ")}): Int {\n${indent(body, 2)}\n}`;
    if (lang === "swift") return `func ${name}(${params.map((param) => `${param}: Int`).join(", ")}) -> Int {\n${indent(body, 2)}\n}`;
    if (lang === "dart") return `int ${name}(${params.map((param) => `int ${param}`).join(", ")}) {\n${indent(body, 2)}\n}`;
    if (lang === "go") return `func ${name}(${params.map((param) => `${param} int`).join(", ")}) int {\n${indent(body, 2)}\n}`;
    if (lang === "rust") return `fn ${name}(${params.map((param) => `${param}: i32`).join(", ")}) -> i32 {\n${indent(body, 2)}\n}`;
    if (lang === "php") return `function ${name}(${params.map((param) => `$${param}`).join(", ")}) {\n${indent(body, 2)}\n}`;
    if (lang === "ruby") return `def ${name}(${params.join(", ")})\n${indent(body, 2)}\nend`;
    return `${name} <- function(${params.join(", ")}) {\n${indent(body, 2)}\n}`;
  };
  const program = (body: string[], functions = "") => {
    const main = body.filter(Boolean).join("\n");
    if (lang === "python" || lang === "javascript" || lang === "typescript" || lang === "lua" || lang === "ruby" || lang === "r" || lang === "php" || lang === "bash") {
      return [functions, main].filter(Boolean).join("\n\n") + "\n";
    }
    if (lang === "java") {
      const scanner = main.includes("input.") ? "Scanner input = new Scanner(System.in);\n" : "";
      return `import java.util.Scanner;\npublic class Main {\n${functions ? indent(functions, 2) + "\n" : ""}  public static void main(String[] args) {\n${indent(scanner + main, 4)}\n  }\n}\n`;
    }
    if (lang === "cpp") {
      return `#include <iostream>\nusing namespace std;\n${functions}\nint main() {\n${indent(main, 2)}\n  return 0;\n}\n`;
    }
    if (lang === "c") {
      const fns = functions.replace(/\bstatic /g, "");
      return `#include <stdio.h>\n${fns}\nint main(void) {\n${indent(main, 2)}\n  return 0;\n}\n`;
    }
    if (lang === "csharp") {
      return `using System;\nclass Program {\n${functions ? indent(functions, 2) + "\n" : ""}  static void Main() {\n${indent(main, 4)}\n  }\n}\n`;
    }
    if (lang === "kotlin") return `${functions}\nfun main() {\n${indent(main, 2)}\n}\n`;
    if (lang === "swift") return `${functions}\nfunc main() {\n${indent(main, 2)}\n}\n`;
    if (lang === "dart") return `${functions}\nvoid main() {\n${indent(main, 2)}\n}\n`;
    if (lang === "go") return `package main\nimport "fmt"\n${functions}\nfunc main() {\n${indent(main, 2)}\n}\n`;
    return `${functions}\nfn main() {\n${indent(main, 2)}\n}\n`;
  };
  const readStrEnded = (name: string) => end(lang, readStr(name));
  const assignEnded = (name: string, expr: string) => end(lang, assign(name, expr));
  const setEnded = (name: string, expr: string) => end(lang, set(name, expr));
  const retEnded = (expr: string) => end(lang, ret(expr));
  return {
    comment,
    str,
    print: printText,
    readNum: readNumEnded,
    readStr: readStrEnded,
    assign: assignEnded,
    set: setEnded,
    ret: retEnded,
    call,
    iff,
    forRange,
    fn,
    program,
    contains,
    concat,
    len,
    div,
  };
}
