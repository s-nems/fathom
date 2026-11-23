import { clamp } from "@/lib/number";

/** Where a replay stands on its timeline and whether the clock moves it. */
export interface PlaybackState {
  position: number;
  playing: boolean;
}

/** Moves by hand. Playing goes on unless the move lands on the end. */
export function seek(state: PlaybackState, total: number, position: number): PlaybackState {
  const landed = clamp(position, 0, total);
  return { position: landed, playing: state.playing && landed < total };
}

/** One step of the clock: forward by one shot, stopping on the last. */
export function tick(state: PlaybackState, total: number): PlaybackState {
  return state.playing ? seek(state, total, state.position + 1) : state;
}

/** Play or pause. Play at the end starts over, and a timeline without shots never plays. */
export function togglePlaying(state: PlaybackState, total: number): PlaybackState {
  if (state.playing) return { ...state, playing: false };
  if (total === 0) return state;
  return { position: state.position >= total ? 0 : state.position, playing: true };
}
