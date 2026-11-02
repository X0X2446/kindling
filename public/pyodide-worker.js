let pyodide = null;
let runnerReady = false;

self.onmessage = async (event) => {
  const { id, code, stdin } = event.data;
  let stdout = "";
  try {
    if (!pyodide) {
      self.postMessage({ id, phase: "loading" });
      importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
      pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" });
    }
    pyodide.setStdout({ batched: (text) => { stdout += `${text}\n`; } });
    pyodide.setStderr({ batched: (text) => { stdout += `${text}\n`; } });
    const lines = String(stdin || "").split("\n");
    let cursor = 0;
    pyodide.setStdin({ stdin: () => (cursor < lines.length ? lines[cursor++] : null) });
    if (!runnerReady) {
      await pyodide.runPythonAsync(`
def __kindling_run(source):
    ns = {"__name__": "__main__", "__builtins__": __builtins__}
    exec(source, ns)
`);
      runnerReady = true;
    }
    const run = pyodide.globals.get("__kindling_run");
    try {
      run(code);
    } finally {
      run.destroy();
    }
    self.postMessage({ id, stdout });
  } catch (error) {
    self.postMessage({ id, stdout, error: error instanceof Error ? error.message : String(error) });
  }
};
