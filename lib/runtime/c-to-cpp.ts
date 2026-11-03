function takeCall(source: string, start: number) {
  let depth = 0;
  let i = start;
  if (source[i] !== "(") return null;
  for (; i < source.length; i++) {
    if (source[i] === "(") depth++;
    else if (source[i] === ")") {
      depth--;
      if (depth === 0) return { inner: source.slice(start + 1, i), end: i + 1 };
    }
  }
  return null;
}

function replaceCalls(source: string, name: string, rewrite: (inner: string) => string) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const at = source.indexOf(name, i);
    if (at < 0) {
      out += source.slice(i);
      break;
    }
    const after = at + name.length;
    if (at > 0 && /[A-Za-z0-9_]/.test(source[at - 1])) {
      out += source.slice(i, after);
      i = after;
      continue;
    }
    let j = after;
    while (source[j] === " " || source[j] === "\n") j++;
    const call = takeCall(source, j);
    if (!call) {
      out += source.slice(i, after);
      i = after;
      continue;
    }
    out += source.slice(i, at) + rewrite(call.inner);
    i = call.end;
    if (source[i] === ";") {
      out += ";";
      i++;
    }
  }
  return out;
}

export function cToCpp(source: string) {
  let code = source.replace(/#include\s*<[^>]+>/g, "");
  code = code.replace(/char\s+([A-Za-z_][A-Za-z0-9_]*)\s*\[\s*\d+\s*\]\s*;/g, "string $1;");
  code = code.replace(/\bint\s+main\s*\(\s*void\s*\)/g, "int main()");
  code = replaceCalls(code, "scanf", (inner) => {
    const name = inner.split(",").at(-1)?.replace(/&/g, "").trim() ?? "n";
    return `cin >> ${name}`;
  });
  code = replaceCalls(code, "printf", (inner) => {
    const comma = inner.indexOf(",");
    const expr = comma >= 0 ? inner.slice(comma + 1).trim() : inner.trim();
    return `cout << (${expr}) << endl`;
  });
  return `#include <iostream>\nusing namespace std;\n${code}`;
}
