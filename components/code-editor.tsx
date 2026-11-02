"use client";

import { cpp, csharp, java, kotlin } from "@codemirror/legacy-modes/mode/clike";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { swift } from "@codemirror/legacy-modes/mode/swift";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { StreamLanguage, type LanguageSupport } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import type { Runner } from "@/lib/runtime/types";

function languageFor(runner: Runner): LanguageSupport | ReturnType<typeof StreamLanguage.define> {
  if (runner === "python") return python();
  if (runner === "javascript" || runner === "canvas") return javascript();
  if (runner === "html") return html();
  if (runner === "lua") return StreamLanguage.define(lua);
  if (runner === "cpp") return StreamLanguage.define(cpp);
  if (runner === "csharp") return StreamLanguage.define(csharp);
  if (runner === "kotlin") return StreamLanguage.define(kotlin);
  if (runner === "swift") return StreamLanguage.define(swift);
  if (runner === "dart") return StreamLanguage.define(java);
  return StreamLanguage.define(java);
}

export function CodeEditor({
  runner,
  value,
  onChange,
}: {
  runner: Runner;
  value: string;
  onChange: (value: string) => void;
}) {
  const extensions = useMemo(() => [languageFor(runner), ...(runner === "html" ? [css()] : [])], [runner]);
  return (
    <div className="overflow-hidden rounded-xl border border-border" aria-label="Code editor">
      <CodeMirror
        value={value}
        height="340px"
        theme={oneDark}
        extensions={extensions}
        onChange={onChange}
        basicSetup={{ lineNumbers: true, foldGutter: false }}
      />
    </div>
  );
}
