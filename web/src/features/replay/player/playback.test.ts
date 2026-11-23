import { describe, expect, it } from "vitest";
import { seek, tick, togglePlaying, type PlaybackState } from "./playback";

const TOTAL = 3;
const PLAYBACK_START: PlaybackState = { position: 0, playing: false };

describe("playback", () => {
  it("should start playing from where it stands", () => {
    // given
    const state = { position: 1, playing: false };

    // when
    const next = togglePlaying(state, TOTAL);

    // then
    expect(next).toEqual({ position: 1, playing: true });
  });

  it("should start over when play is pressed at the end", () => {
    // given
    const state = { position: TOTAL, playing: false };

    // when
    const next = togglePlaying(state, TOTAL);

    // then
    expect(next).toEqual({ position: 0, playing: true });
  });

  it("should not start when there is nothing to play", () => {
    // given
    const noShots = 0;

    // when
    const next = togglePlaying(PLAYBACK_START, noShots);

    // then
    expect(next).toEqual(PLAYBACK_START);
  });

  it("should pause where it stands", () => {
    // given
    const state = { position: 2, playing: true };

    // when
    const next = togglePlaying(state, TOTAL);

    // then
    expect(next).toEqual({ position: 2, playing: false });
  });

  it("should advance by one shot per tick and stop on the last", () => {
    // given
    const state = { position: 1, playing: true };

    // when
    const second = tick(state, TOTAL);
    const third = tick(second, TOTAL);

    // then
    expect(second).toEqual({ position: 2, playing: true });
    expect(third).toEqual({ position: 3, playing: false });
  });

  it("should not move on a tick while paused", () => {
    // given
    const state = { position: 1, playing: false };

    // when
    const next = tick(state, TOTAL);

    // then
    expect(next).toBe(state);
  });

  it("should keep a seek within the timeline", () => {
    // given
    const state = { position: 1, playing: false };

    // when
    const before = seek(state, TOTAL, -5);
    const beyond = seek(state, TOTAL, 99);

    // then
    expect(before.position).toBe(0);
    expect(beyond.position).toBe(TOTAL);
  });
});
