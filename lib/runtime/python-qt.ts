export const QT_PRELUDE = `
import json, sys, types

class _Signal:
    def __init__(self):
        self._fn = None
    def connect(self, fn):
        self._fn = fn

class _Node:
    def __init__(self, kind, parent=None, **kw):
        self.kind = kind
        self.kw = kw
        self.children = []
        self.visible = False
        self.parent = None
        if parent is not None:
            parent.children.append(self)
            self.parent = parent
        else:
            _ROOTS.append(self)
    def show(self):
        self.visible = True
        return self
    def setWindowTitle(self, title):
        self.kw["title"] = str(title)
    def setText(self, text):
        self.kw["text"] = str(text)
    def text(self):
        return str(self.kw.get("text", ""))
    def dump(self):
        return {
            "type": self.kind,
            "text": str(self.kw.get("text", "")),
            "title": str(self.kw.get("title", "")),
            "children": [child.dump() for child in self.children],
        }

_ROOTS = []

class QApplication:
    def __init__(self, argv=None):
        self.argv = argv
    def exec(self):
        return _emit()
    def exec_(self):
        return _emit()

class QWidget(_Node):
    def __init__(self, parent=None):
        super().__init__("window", parent=parent, title="Window", text="")

class QMainWindow(QWidget):
    def setCentralWidget(self, widget):
        if widget in _ROOTS:
            _ROOTS.remove(widget)
        if widget not in self.children:
            self.children.append(widget)
        widget.parent = self

class QLabel(_Node):
    def __init__(self, text="", parent=None):
        super().__init__("text", parent=parent, text=str(text), title="")

class QPushButton(_Node):
    def __init__(self, text="", parent=None):
        super().__init__("button", parent=parent, text=str(text), title="")
        self.clicked = _Signal()

class QLineEdit(_Node):
    def __init__(self, text="", parent=None):
        super().__init__("field", parent=parent, text=str(text), title="")

class QVBoxLayout:
    def __init__(self, parent=None):
        self.parent = parent
    def addWidget(self, widget):
        if self.parent is None:
            return
        if widget in _ROOTS:
            _ROOTS.remove(widget)
        if widget not in self.parent.children:
            self.parent.children.append(widget)
        widget.parent = self.parent

class QHBoxLayout(QVBoxLayout):
    pass

def _emit():
    shown = [node for node in _ROOTS if node.visible]
    use = shown or [node for node in _ROOTS if node.children]
    if len(use) == 1:
        payload = use[0].dump()
    elif use:
        payload = {"type": "column", "text": "", "title": "", "children": [node.dump() for node in use]}
    else:
        payload = {"type": "window", "title": "Preview", "text": "", "children": []}
    if payload["type"] != "window":
        payload = {"type": "window", "title": payload.get("title") or "Preview", "text": "", "children": [payload]}
    print("[[WIDGETS]]" + json.dumps(payload))
    return 0

_qt = types.ModuleType("PySide6")
_widgets = types.ModuleType("PySide6.QtWidgets")
for _name, _value in list(globals().items()):
    if _name.startswith("Q"):
        setattr(_widgets, _name, _value)
sys.modules["PySide6"] = _qt
sys.modules["PySide6.QtWidgets"] = _widgets
_qt.QtWidgets = _widgets
`;
