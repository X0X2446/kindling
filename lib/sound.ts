let context: AudioContext | null = null;

export function playClear() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!context) context = new AudioCtx();
  if (context.state === "suspended") void context.resume();
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((frequency, index) => {
    const osc = context!.createOscillator();
    const gain = context!.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    const start = context!.currentTime + index * 0.07;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.07, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(gain).connect(context!.destination);
    osc.start(start);
    osc.stop(start + 0.24);
  });
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
