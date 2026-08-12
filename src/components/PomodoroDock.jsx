import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

const FOCUS_SECONDS = 25 * 60;
const REST_SECONDS = 5 * 60;

const MODE_META = {
  focus: {
    label: 'Focus',
    badgeClass: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/30',
    ringClass: 'ring-emerald-300/30',
  },
  rest: {
    label: 'Rest',
    badgeClass: 'bg-sky-400/20 text-sky-200 border-sky-300/30',
    ringClass: 'ring-sky-300/30',
  },
};

function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function durationForMode(mode) {
  return mode === 'focus' ? FOCUS_SECONDS : REST_SECONDS;
}

/**
 * Plays a short synthesized "alert ring" chime using the Web Audio API.
 * No external audio asset required.
 */
function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const notes = [880, 1174.66]; // A5 -> D6, a bright two-tone chime

    notes.forEach((freq, i) => {
      const startTime = now + i * 0.16;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.55);
    });

    // Close the context once the chime has finished playing to free resources.
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 900);
  } catch {
    // Web Audio unsupported/blocked — fail silently, timer logic still works.
  }
}

/**
 * PomodoroDock
 *
 * Floating glass navigation dock anchored to the bottom of the viewport.
 * Owns its own Pomodoro focus/rest cycle (independent of ambient audio
 * playback) and exposes a slot (`children`) for other dock controls such
 * as a volume mixer panel toggle.
 *
 * Props:
 *  - isPlaying: boolean — whether ambient audio is currently playing.
 *  - onTogglePlay: () => void — called when the ambient audio play/pause
 *    button is pressed. Playback state itself is owned by the parent.
 *  - children: ReactNode — optional extra controls rendered inside the dock.
 */
export default function PomodoroDock({ isPlaying, onTogglePlay, children }) {
  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  // Drift-resistant timing: we track the real-world deadline instead of
  // naively decrementing once per tick, so backgrounded/throttled tabs
  // don't cause the countdown to lag behind wall-clock time.
  const deadlineRef = useRef(null); // Date.now() timestamp when timer hits 0
  const modeRef = useRef(mode);
  const intervalRef = useRef(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Recompute secondsLeft from the stored deadline (called on each tick and
  // on visibility change) instead of trusting elapsed setInterval calls.
  const syncFromDeadline = useCallback(() => {
    if (deadlineRef.current == null) return;
    const remainingMs = deadlineRef.current - Date.now();
    const remaining = Math.max(0, remainingMs / 1000);
    setSecondsLeft(remaining);

    if (remaining <= 0) {
      // Cycle complete: flip mode, reset deadline for the new cycle, ring.
      const nextMode = modeRef.current === 'focus' ? 'rest' : 'focus';
      const nextDuration = durationForMode(nextMode);
      modeRef.current = nextMode;
      setMode(nextMode);
      setSecondsLeft(nextDuration);
      deadlineRef.current = Date.now() + nextDuration * 1000;
      playAlertChime();
    }
  }, []);

  const startTimer = useCallback(() => {
    // Establish/refresh the deadline based on current secondsLeft.
    setSecondsLeft((current) => {
      deadlineRef.current = Date.now() + current * 1000;
      return current;
    });
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    if (deadlineRef.current != null) {
      const remainingMs = deadlineRef.current - Date.now();
      setSecondsLeft(Math.max(0, remainingMs / 1000));
    }
    deadlineRef.current = null;
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    clearTick();
    deadlineRef.current = null;
    setIsRunning(false);
    modeRef.current = 'focus';
    setMode('focus');
    setSecondsLeft(FOCUS_SECONDS);
  }, [clearTick]);

  // Main ticking effect: runs a 1s interval while isRunning, but always
  // re-derives the remaining time from the stored deadline (Date.now())
  // rather than assuming each tick represents exactly 1000ms.
  useEffect(() => {
    if (!isRunning) {
      clearTick();
      return;
    }

    intervalRef.current = setInterval(() => {
      syncFromDeadline();
    }, 1000);

    return clearTick;
  }, [isRunning, syncFromDeadline, clearTick]);

  // Tab Optimization: when the tab regains visibility (or on focus), resync
  // immediately from the deadline so throttled background timers don't
  // leave the displayed countdown stale/drifted.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        syncFromDeadline();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [isRunning, syncFromDeadline]);

  // Keep the browser tab title live with the countdown + mode, and restore
  // a sensible default title on unmount.
  useEffect(() => {
    const meta = MODE_META[mode];
    document.title = `${formatTime(secondsLeft)} · ${meta.label} — AuraFlow`;
    return () => {
      document.title = 'AuraFlow';
    };
  }, [mode, secondsLeft]);

  const meta = MODE_META[mode];
  const totalForMode = durationForMode(mode);
  const progress = 1 - secondsLeft / totalForMode;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 px-2 sm:bottom-6">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/20 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl ring-1 ${meta.ringClass} sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-4`}
      >
        {/* Pomodoro timer block */}
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${meta.badgeClass}`}
          >
            {meta.label}
          </span>
          <span
            className="select-none font-mono text-2xl font-semibold tabular-nums text-white tracking-tight sm:text-3xl"
            aria-live="polite"
          >
            {formatTime(secondsLeft)}
          </span>
          {/* Minimal progress indicator */}
          <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-white/15 sm:block">
            <div
              className="h-full rounded-full bg-white/70 transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
        </div>

        {/* Pomodoro controls */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {isRunning ? (
            <button
              type="button"
              onClick={pauseTimer}
              aria-label="Pause focus timer"
              title="Pause timer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 sm:h-10 sm:w-10"
            >
              <Pause size={16} className="sm:h-[18px] sm:w-[18px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startTimer}
              aria-label="Start focus timer"
              title="Start timer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 sm:h-10 sm:w-10"
            >
              <Play size={16} className="sm:h-[18px] sm:w-[18px]" />
            </button>
          )}
          <button
            type="button"
            onClick={resetTimer}
            aria-label="Reset focus timer"
            title="Reset timer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 sm:h-10 sm:w-10"
          >
            <RotateCcw size={16} className="sm:h-[18px] sm:w-[18px]" />
          </button>
        </div>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-white/15 sm:block" />

        {/* Ambient audio control (separate from the Pomodoro run state) */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause ambient audio' : 'Play ambient audio'}
            title={isPlaying ? 'Pause ambient audio' : 'Play ambient audio'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white transition hover:bg-white/25 active:scale-95 sm:h-10 sm:w-10"
          >
            {isPlaying ? (
              <Volume2 size={16} className="sm:h-[18px] sm:w-[18px]" />
            ) : (
              <VolumeX size={16} className="sm:h-[18px] sm:w-[18px]" />
            )}
          </button>
        </div>

        {/* Extra slot for other dock controls (e.g. volume mixer panel) */}
        {children ? (
          <div className="flex shrink-0 items-center gap-2 border-l border-white/15 pl-3">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
