import { useCallback, useEffect, useState } from "react";
import { seek, tick, togglePlaying, type PlaybackState } from "./playback";

export const SPEEDS = [0.5, 1, 2, 4, 8] as const;
const DEFAULT_SPEED = 2;
const STEP_MILLIS_AT_UNIT_SPEED = 600;

export interface Playback {
  position: number;
  total: number;
  playing: boolean;
  speed: number;
  seek: (position: number) => void;
  step: (by: number) => void;
  togglePlaying: () => void;
  setSpeed: (speed: number) => void;
}

/** The position on a timeline of `total` shots, moved by hand or by a clock. It starts at `initial`. */
export function usePlayback(total: number, initial = 0): Playback {
  const [state, setState] = useState<PlaybackState>({ position: initial, playing: false });
  const [speed, setSpeed] = useState<number>(DEFAULT_SPEED);
  const { position, playing } = state;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setState((current) => tick(current, total)),
      STEP_MILLIS_AT_UNIT_SPEED / speed,
    );
    return () => window.clearInterval(timer);
  }, [playing, speed, total]);

  return {
    position,
    total,
    playing,
    speed,
    setSpeed,
    seek: useCallback((to: number) => setState((current) => seek(current, total, to)), [total]),
    step: useCallback((by: number) => setState((current) => seek(current, total, current.position + by)), [total]),
    togglePlaying: useCallback(() => setState((current) => togglePlaying(current, total)), [total]),
  };
}
