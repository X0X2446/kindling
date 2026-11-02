import vm from "node:vm";

export function runJavaScript(code: string, stdin = ""): { stdout: string; error?: string } {
  const lines = stdin.split("\n");
  let index = 0;
  let stdout = "";
  const sandbox = {
    console: {
      log: (...args: unknown[]) => {
        stdout += args.map(String).join(" ") + "\n";
      },
    },
    input: () => lines[index++] ?? "",
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
  };
  try {
    vm.runInNewContext(code, sandbox, { timeout: 1500 });
    return { stdout };
  } catch (error) {
    return { stdout, error: error instanceof Error ? error.message : "JavaScript stopped." };
  }
}
