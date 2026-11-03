export type Runner =
  | "python"
  | "javascript"
  | "typescript"
  | "lua"
  | "html"
  | "canvas"
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
  | "bash"
  | "sql";

export type TestCase = { stdin?: string; before?: string; expected: string };

export type PreviewNode =
  | { type: "window"; title: string; text: string; children: PreviewNode[] }
  | { type: "column" | "row"; title: string; text: string; children: PreviewNode[] }
  | { type: "text" | "button" | "field"; title: string; text: string; children: PreviewNode[] };

export type DrawOp =
  | { op: "fillRect"; x: number; y: number; w: number; h: number; fill: string }
  | { op: "clearRect"; x: number; y: number; w: number; h: number }
  | { op: "fillText"; text: string; x: number; y: number; fill: string }
  | { op: "arc"; x: number; y: number; r: number; fill: string };

export type CanvasFrame = { t: number; ops: DrawOp[] };

export type Check =
  | { kind: "stdout"; expected: string }
  | { kind: "cases"; cases: TestCase[] }
  | { kind: "html"; parts: string[] }
  | { kind: "widgets"; texts: string[] }
  | { kind: "app"; expected: string; texts: string[] }
  | { kind: "frames"; frames: number; commands: string[] }
  | { kind: "canvas"; points: { t: number; x: number; y: number; fill: string }[]; texts?: string[] };

export type RunOutput = {
  code: string;
  stdout: string;
  error?: string;
  widgets?: PreviewNode | null;
  frames?: string[][];
  canvas?: CanvasFrame[];
};
