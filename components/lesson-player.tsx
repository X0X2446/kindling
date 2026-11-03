"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { CanvasPreview, FramePreview, HtmlPreview, WidgetPreview } from "@/components/previews";
import { useProgress } from "@/components/progress-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lessonKey } from "@/lib/keys";
import { playClear } from "@/lib/sound";
import { grade } from "@/lib/runtime/grade";
import { parseFrames } from "@/lib/runtime/preview";
import { runCode } from "@/lib/runtime/browser";
import type { Check, RunOutput, Runner } from "@/lib/runtime/types";

export type LessonPayload = {
  courseSlug: string;
  courseTitle: string;
  lessonSlug: string;
  title: string;
  index: number;
  count: number;
  xp: number;
  project: boolean;
  paragraphs: string[];
  sample?: string;
  starter: string;
  solution: string;
  hints: string[];
  stdin?: string;
  check: Check;
  runner: Runner;
  qt: boolean;
  prelude?: string;
  label: string;
  honesty?: string;
  prevSlug?: string;
  prevHref?: string;
  prevTitle?: string;
  nextHref?: string;
  nextTitle?: string;
  milestone?: { title: string; brief: string; step: number; steps: number; tier: string };
  recommendations: { slug: string; title: string; blurb: string }[];
};

export function LessonPlayer(props: LessonPayload) {
  const key = lessonKey(props.courseSlug, props.lessonSlug);
  const { ready, state, assist, clear } = useProgress();
  const [code, setCode] = useState(props.starter);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("");
  const [output, setOutput] = useState<RunOutput | null>(null);
  const [detail, setDetail] = useState("");
  const [ok, setOk] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [peeked, setPeeked] = useState(false);
  const [confirmPeek, setConfirmPeek] = useState(false);
  const [award, setAward] = useState<number | null>(null);
  const [shownXp, setShownXp] = useState<number | null>(null);
  const savedAssist = state.assists[key];
  const assistStamp = `${ready}:${savedAssist?.hints ?? 0}:${savedAssist?.solution ? 1 : 0}`;
  const [seenStamp, setSeenStamp] = useState(assistStamp);
  if (seenStamp !== assistStamp) {
    setSeenStamp(assistStamp);
    setHintsUsed(savedAssist?.hints ?? 0);
    setPeeked(Boolean(savedAssist?.solution));
  }

  const runRef = useRef<() => void>(() => {});
  const prevKey = props.prevSlug ? lessonKey(props.courseSlug, props.prevSlug) : "";
  const locked = Boolean(ready && prevKey && !state.completed[prevKey]);
  const tests = props.check.kind === "cases" ? props.check.cases : null;
  const sampleIn = tests?.[0]?.stdin ?? props.stdin;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!award) return;
    const from = Math.max(0, state.xp - award);
    const to = state.xp;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (reduce) {
        setShownXp(to);
        return;
      }
      const t = Math.min(1, (now - start) / 700);
      setShownXp(Math.round(from + (to - from) * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [award, state.xp]);

  async function finishClear(result: RunOutput, detailText: string) {
    setOutput(result);
    setDetail(detailText);
    setOk(true);
    setRunning(false);
    setPhase("");
    const clean = hintsUsed === 0 && !peeked;
    const awarded = clear(key, props.xp, clean);
    if (state.sound) playClear();
    setAward(awarded);
  }

  async function onRun() {
    if (running || locked || (!ready && Boolean(props.prevSlug))) return;
    setRunning(true);
    setOk(false);
    setAward(null);
    setShownXp(null);
    const note = (next: string) => {
      if (next === "loading") setPhase("Loading Python into the browser. The first run takes a moment.");
    };
    if (tests) {
      let last: RunOutput | null = null;
      for (let index = 0; index < tests.length; index += 1) {
        const test = tests[index];
        setPhase(`Test ${index + 1} of ${tests.length}`);
        const source = `${props.prelude ?? ""}${test.before ? `${test.before}\n` : ""}${code}`;
        const result = await runCode(props.runner, source, test.stdin ?? "", props.qt, note);
        last = { ...result, code };
        const verdict = grade({ kind: "stdout", expected: test.expected }, last);
        if (!verdict.ok) {
          setOutput(last);
          setDetail(`Test ${index + 1} of ${tests.length} failed.\n${verdict.detail}`);
          setOk(false);
          setRunning(false);
          setPhase("");
          setAward(null);
          return;
        }
      }
      await finishClear(last ?? { code, stdout: "" }, `All ${tests.length} tests passed.`);
      return;
    }
    setPhase(props.runner === "python" ? "Starting Python…" : "Running…");
    const result = await runCode(props.runner, code, props.stdin ?? "", props.qt, note);
    const verdict = grade(props.check, result);
    if (!verdict.ok) {
      setOutput(result);
      setDetail(verdict.detail);
      setOk(false);
      setRunning(false);
      setPhase("");
      setAward(null);
      return;
    }
    await finishClear(result, verdict.detail);
  }

  useEffect(() => {
    runRef.current = () => {
      void onRun();
    };
  });

  function showHint() {
    if (hintsUsed >= props.hints.length) return;
    const next = hintsUsed + 1;
    setHintsUsed(next);
    assist(key, { hints: next });
  }

  function showSolution() {
    setPeeked(true);
    setConfirmPeek(false);
    setCode(props.solution);
    assist(key, { solution: true });
  }

  const cleared = Boolean(state.completed[key]);
  const frames = output?.frames?.length ? output.frames : output ? parseFrames(output.stdout) : [];

  const explain = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{props.courseTitle}</span>
        <span>Lesson {props.index + 1} of {props.count}</span>
        <span>{props.xp} XP</span>
        {props.project ? <span className="rounded-full bg-muted px-2 py-0.5 text-brass">Project</span> : null}
        {props.milestone ? <span className="rounded-full bg-muted px-2 py-0.5">{props.milestone.tier} · step {props.milestone.step} of {props.milestone.steps}</span> : null}
        {cleared ? <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">{state.completed[key]?.clean ? "Clean clear" : "Cleared"}</span> : null}
      </div>
      <h1 className="text-3xl text-balance">{props.title}</h1>
      <p className="text-sm text-brass">{props.label}</p>
      {props.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-6 text-foreground/90">{paragraph}</p>
      ))}
      {props.sample ? <pre className="overflow-x-auto rounded-xl bg-card p-4 font-mono text-xs leading-5 text-foreground">{props.sample}</pre> : null}
      {tests ? (
        <p className="text-sm text-muted-foreground">
          The checker runs {tests.length} tests.{sampleIn ? " The sample input below is the first one." : ""} Expected answers stay hidden until a test fails.
        </p>
      ) : null}
      {props.milestone ? <p className="text-sm leading-6 text-muted-foreground">{props.milestone.brief}</p> : null}
      {sampleIn ? <p className="text-sm text-muted-foreground">The checker types this input: <span className="font-mono text-foreground">{sampleIn.trim()}</span></p> : null}
      {props.honesty ? <p className="rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">{props.honesty}</p> : null}
      {hintsUsed > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          {props.hints.slice(0, hintsUsed).map((hint, index) => (
            <p key={hint} className="text-sm"><span className="text-brass">Hint {index + 1}. </span>{hint}</p>
          ))}
        </div>
      ) : null}
    </div>
  );

  const bench = locked ? (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
      <p className="text-lg">This lesson is locked</p>
      <p className="text-sm leading-6 text-muted-foreground">Clear the previous lesson and this one opens. The path stays in order so each idea has the one before it.</p>
      {props.prevHref ? (
        <Link href={props.prevHref} className="text-sm text-brass underline-offset-4 hover:underline">
          Back to {props.prevTitle}
        </Link>
      ) : null}
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <CodeEditor runner={props.runner} value={code} onChange={setCode} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void onRun()} disabled={running || (!ready && Boolean(props.prevSlug))}>
          {running ? "Running" : "Run"}
        </Button>
        <Button type="button" variant="outline" onClick={showHint} disabled={hintsUsed >= props.hints.length}>
          Hint
        </Button>
        <Button type="button" variant="ghost" onClick={() => { setCode(props.starter); setOutput(null); setDetail(""); setOk(false); setAward(null); }}>
          Reset
        </Button>
        {confirmPeek ? (
          <>
            <Button type="button" variant="destructive" onClick={showSolution}>Show it</Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmPeek(false)}>Keep trying</Button>
          </>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setConfirmPeek(true)}>Solution</Button>
        )}
        <span className="text-xs text-muted-foreground">Ctrl or Cmd + Enter</span>
      </div>
      {confirmPeek ? <p className="text-sm text-muted-foreground">Looking at the solution still lets you clear the lesson. It will not count as a clean clear.</p> : null}
      {phase ? <p className="text-sm text-brass">{phase}</p> : null}
      <section className="relative overflow-hidden rounded-xl border border-border bg-card p-4" aria-live="polite">
        {ok ? <Sparks /> : null}
        {ok && award ? <Confetti /> : null}
        {ok ? (
          <p className="relative text-sm">
            {award ? <span className="text-brass">+{award} XP{shownXp !== null ? ` · ${shownXp} total` : ""}. </span> : null}
            {award === 0 ? "Still clear. " : null}
            {hintsUsed === 0 && !peeked ? "Clean clear." : "Lesson cleared."}
          </p>
        ) : null}
        {output?.error ? <p className="relative whitespace-pre-wrap font-mono text-sm text-destructive">{output.error}</p> : null}
        {output && !output.error && props.runner !== "html" && props.runner !== "canvas" ? (
          <pre className="relative max-h-40 overflow-auto font-mono text-xs leading-5 text-foreground">{output.stdout || "(no output)"}</pre>
        ) : null}
        {detail ? <p className="relative mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{detail}</p> : null}
        {ok && props.nextHref ? (
          <Link href={props.nextHref} className="relative mt-3 inline-flex text-sm text-brass underline-offset-4 hover:underline">
            Next: {props.nextTitle}
          </Link>
        ) : null}
        {ok && !props.nextHref && props.recommendations.length ? (
          <div className="relative mt-4 flex flex-col gap-2">
            <p className="text-sm">You finished this course. Take the language somewhere next.</p>
            {props.recommendations.map((course) => (
              <Link key={course.slug} href={`/courses/${course.slug}`} className="rounded-lg border border-border px-3 py-2 hover:bg-muted">
                <span className="block text-sm">{course.title}</span>
                <span className="block text-xs text-muted-foreground">{course.blurb}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
      {props.runner === "html" ? <HtmlPreview code={code} /> : null}
      {output?.widgets ? <WidgetPreview node={output.widgets} /> : null}
      {output?.canvas ? <CanvasPreview frames={output.canvas} /> : null}
      {frames.length ? <FramePreview frames={frames} /> : null}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="hidden gap-8 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="lg:max-h-[calc(100vh-6rem)] lg:overflow-auto lg:pr-2">{explain}</div>
        {bench}
      </div>
      <div className="lg:hidden">
        <Tabs defaultValue="explain">
          <TabsList>
            <TabsTrigger value="explain">Explain</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <TabsContent value="explain" className="pt-4">{explain}</TabsContent>
          <TabsContent value="code" className="pt-4">{bench}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Sparks() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 14 }, (_, index) => (
        <span
          key={index}
          className="kindling-spark absolute bottom-2 size-1.5 rounded-full"
          style={{
            left: `${6 + ((index * 7) % 88)}%`,
            animationDelay: `${(index % 5) * 70}ms`,
            background: index % 2 ? "var(--brass)" : "var(--flame)",
          }}
        />
      ))}
    </div>
  );
}

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden" aria-hidden>
      {Array.from({ length: 22 }, (_, index) => (
        <span
          key={index}
          className="kindling-confetti absolute top-0 h-2 w-1.5 rounded-sm"
          style={{
            left: `${4 + ((index * 4.3) % 92)}%`,
            animationDelay: `${(index % 7) * 40}ms`,
            background: index % 3 === 0 ? "var(--brass)" : index % 3 === 1 ? "var(--flame)" : "var(--foreground)",
          }}
        />
      ))}
    </div>
  );
}
