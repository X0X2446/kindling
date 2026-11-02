export type Completion = { xp: number; clean: boolean };
export type Assist = { hints: number; solution: boolean };

export type ProgressState = {
  xp: number;
  streak: number;
  lastDay: string;
  completed: Record<string, Completion>;
  assists: Record<string, Assist>;
  sound: boolean;
};

export const emptyProgress = (): ProgressState => ({
  xp: 0,
  streak: 0,
  lastDay: "",
  completed: {},
  assists: {},
  sound: true,
});

export const ranks = [
  { name: "Spark", min: 0 },
  { name: "Ember", min: 80 },
  { name: "Flame", min: 220 },
  { name: "Hearth", min: 480 },
  { name: "Forge", min: 800 },
  { name: "Beacon", min: 1200 },
  { name: "Supernova", min: 1700 },
];

export function rankFor(xp: number) {
  let current = ranks[0];
  for (const rank of ranks) {
    if (xp >= rank.min) current = rank;
  }
  const index = ranks.indexOf(current);
  const next = ranks[index + 1];
  const span = next ? next.min - current.min : 1;
  const into = next ? Math.min(1, (xp - current.min) / span) : 1;
  return { name: current.name, next: next?.name ?? null, into, xp };
}

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDay(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return todayKey(date);
}

export function noteAssist(state: ProgressState, key: string, patch: Partial<Assist>): ProgressState {
  const current = state.assists[key] ?? { hints: 0, solution: false };
  return { ...state, assists: { ...state.assists, [key]: { ...current, ...patch } } };
}

export function clearLesson(state: ProgressState, key: string, xp: number, clean: boolean): { state: ProgressState; awarded: number } {
  if (state.completed[key]) return { state, awarded: 0 };
  const today = todayKey();
  let streak = 1;
  if (state.lastDay === today) streak = state.streak || 1;
  else if (state.lastDay === shiftDay(today, -1)) streak = state.streak + 1;
  return {
    awarded: xp,
    state: {
      ...state,
      xp: state.xp + xp,
      streak,
      lastDay: today,
      completed: { ...state.completed, [key]: { xp, clean } },
    },
  };
}

const KEY = "kindling.progress.v1";
const serverState = emptyProgress();
let memory = serverState;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getProgressSnapshot() {
  if (!loaded && typeof window !== "undefined") {
    memory = loadProgress();
    loaded = true;
  }
  return memory;
}

export function getServerProgressSnapshot() {
  return serverState;
}

export function updateProgress(recipe: (current: ProgressState) => ProgressState) {
  memory = recipe(getProgressSnapshot());
  loaded = true;
  saveProgress(memory);
  emit();
}

export function clearStored(key: string, xp: number, clean: boolean) {
  const result = clearLesson(getProgressSnapshot(), key, xp, clean);
  memory = result.state;
  loaded = true;
  saveProgress(memory);
  emit();
  return result.awarded;
}

export function replaceProgress(next: ProgressState) {
  memory = next;
  loaded = true;
  saveProgress(next);
  emit();
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressState;
    return { ...emptyProgress(), ...parsed, completed: parsed.completed ?? {}, assists: parsed.assists ?? {} };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
