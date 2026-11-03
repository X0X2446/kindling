export function stripTypes(source: string) {
  const withoutBlocks = source
    .replace(/\binterface\s+\w+[^{]*\{[^}]*\}/g, "")
    .replace(/\btype\s+\w+\s*=\s*[^;\n]+;?/g, "");
  return withoutBlocks.replace(/:\s*[A-Za-z_][A-Za-z0-9_<>\[\]|& ]*(?=\s*[=,)\n{])/g, "");
}
