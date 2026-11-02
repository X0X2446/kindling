"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import {
  clearStored,
  emptyProgress,
  getProgressSnapshot,
  getServerProgressSnapshot,
  replaceProgress,
  subscribeProgress,
  updateProgress,
  type ProgressState,
} from "@/lib/progress";

type ProgressApi = {
  ready: boolean;
  state: ProgressState;
  assist: (key: string, patch: { hints?: number; solution?: boolean }) => void;
  clear: (key: string, xp: number, clean: boolean) => number;
  toggleSound: () => void;
  reset: () => void;
};

const ProgressContext = createContext<ProgressApi | null>(null);

function subscribeReady() {
  return () => {};
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const api = useMemo<ProgressApi>(() => ({
    ready,
    state,
    assist(key, patch) {
      updateProgress((current) => {
        const previous = current.assists[key] ?? { hints: 0, solution: false };
        return { ...current, assists: { ...current.assists, [key]: { ...previous, ...patch } } };
      });
    },
    clear(key, xp, clean) {
      return clearStored(key, xp, clean);
    },
    toggleSound() {
      updateProgress((current) => ({ ...current, sound: !current.sound }));
    },
    reset() {
      replaceProgress(emptyProgress());
    },
  }), [ready, state]);

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("Progress is only available inside the app shell.");
  return value;
}
