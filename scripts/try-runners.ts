import { runLua } from "../lib/runtime/lua-run";
import { runPython } from "../lib/runtime/python-run";
import { runJavaScript } from "../lib/runtime/js-run";
import { recordCanvas } from "../lib/runtime/canvas";

const lua = runLua(`print("hi", 1 + 2)\nlocal t = {10, 20}\nprint(t[1], #t)`);
console.log("lua", lua);
const py = runPython(`print("Hello, Python")`);
console.log("py", py);
const qt = runPython(
  `import sys
from PySide6.QtWidgets import QApplication, QLabel, QPushButton, QVBoxLayout, QWidget
app = QApplication(sys.argv)
window = QWidget()
window.setWindowTitle("Notes")
layout = QVBoxLayout(window)
layout.addWidget(QLabel("Hello"))
layout.addWidget(QPushButton("Save"))
window.show()
app.exec()`,
  "",
  true,
);
console.log("qt", qt.stdout);
console.log("qt err", qt.error);
const js = runJavaScript(`console.log("js", 1 + 2)`);
console.log("js", js);
const canvas = recordCanvas(
  `function draw(ctx, t) { ctx.fillStyle = "#ff6b4a"; ctx.fillRect(20 + t * 80, 70, 24, 24); }`,
  [0, 1],
);
console.log("canvas", JSON.stringify(canvas));
