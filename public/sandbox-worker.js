self.onmessage = (event) => {
  const { id, mode, code, stdin, times } = event.data;
  try {
    if (mode === "canvas") {
      const frames = [];
      for (const t of times) {
        const ops = [];
        const ctx = {
          fillStyle: "#000000",
          _arc: null,
          fillRect(x, y, w, h) {
            ops.push({ op: "fillRect", x: Number(x), y: Number(y), w: Number(w), h: Number(h), fill: String(this.fillStyle) });
          },
          clearRect(x, y, w, h) {
            ops.push({ op: "clearRect", x: Number(x), y: Number(y), w: Number(w), h: Number(h) });
          },
          fillText(text, x, y) {
            ops.push({ op: "fillText", text: String(text), x: Number(x), y: Number(y), fill: String(this.fillStyle) });
          },
          beginPath() {
            this._arc = null;
          },
          arc(x, y, r) {
            this._arc = { x: Number(x), y: Number(y), r: Number(r) };
          },
          fill() {
            if (this._arc) ops.push({ op: "arc", x: this._arc.x, y: this._arc.y, r: this._arc.r, fill: String(this.fillStyle) });
          },
          stroke() {},
        };
        const run = new Function(
          "ctx",
          "t",
          `${code}\nif (typeof draw !== "function") throw new Error("Define a function named draw(ctx, t).");\ndraw(ctx, t);`,
        );
        run(ctx, t);
        frames.push({ t, ops });
      }
      self.postMessage({ id, canvas: frames, stdout: "" });
      return;
    }
    const lines = String(stdin || "").split("\n");
    let index = 0;
    let stdout = "";
    const consoleProxy = {
      log: (...args) => {
        stdout += args.map(String).join(" ") + "\n";
      },
    };
    const input = () => lines[index++] ?? "";
    const run = new Function("console", "input", code);
    run(consoleProxy, input);
    self.postMessage({ id, stdout });
  } catch (error) {
    self.postMessage({ id, stdout: "", error: error instanceof Error ? error.message : "The runner stopped." });
  }
};
