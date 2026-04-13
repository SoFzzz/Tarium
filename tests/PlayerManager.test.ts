import test from "node:test";
import assert from "node:assert/strict";

import type { MediaAdapter } from "../src/media/MediaAdapter";
import { PlayerManager } from "../src/player/PlayerManager";
import type { ITrack } from "../src/types";

const createTrack = (id: string): ITrack => ({
  id,
  videoId: `video-${id}`,
  title: `Track ${id}`,
  artist: `Artist ${id}`,
  thumbnailUrl: `https://img.youtube.com/${id}.jpg`,
});

class FakeMediaAdapter implements MediaAdapter {
  public playedTrackIds: string[] = [];
  public pauseCalls = 0;
  public volumeHistory: number[] = [];
  public shouldReject = false;

  async play(track: ITrack): Promise<void> {
    this.playedTrackIds.push(track.id);

    if (this.shouldReject) {
      throw new Error("play failed");
    }
  }

  async pause(): Promise<void> {
    this.pauseCalls += 1;
  }

  setVolume(volume: number): void {
    this.volumeHistory.push(volume);
  }
}

test("loadQueue initializes queue and emits a single notification", () => {
  const manager = new PlayerManager();
  const snapshots: string[][] = [];

  manager.subscribe((state) => {
    snapshots.push(state.queue.map((track) => track.id));
  });

  manager.loadQueue([createTrack("a"), createTrack("b"), createTrack("c")]);

  assert.deepEqual(manager.getState().queue.map((track) => track.id), ["a", "b", "c"]);
  assert.equal(manager.getState().currentTrack?.id, "a");
  assert.equal(snapshots.length, 1);
});

test("subscribe returns an unsubscribe function", () => {
  const manager = new PlayerManager([createTrack("a")]);
  let notifications = 0;

  const unsubscribe = manager.subscribe(() => {
    notifications += 1;
  });

  manager.addTrack(createTrack("b"));
  unsubscribe();
  manager.addTrack(createTrack("c"));

  assert.equal(notifications, 1);
});

test("play, pause and togglePlayPause update state and adapter calls", async () => {
  const adapter = new FakeMediaAdapter();
  const manager = new PlayerManager([createTrack("a")], adapter);

  await manager.play();
  assert.equal(manager.getState().isPlaying, true);
  assert.deepEqual(adapter.playedTrackIds, ["a"]);

  await manager.togglePlayPause();
  assert.equal(manager.getState().isPlaying, false);
  assert.equal(adapter.pauseCalls, 1);

  await manager.togglePlayPause();
  assert.equal(manager.getState().isPlaying, true);
  assert.deepEqual(adapter.playedTrackIds, ["a", "a"]);
});

test("playNext and playPrevious move through the queue", async () => {
  const adapter = new FakeMediaAdapter();
  const manager = new PlayerManager([createTrack("a"), createTrack("b"), createTrack("c")], adapter);

  const nextTrack = await manager.playNext();
  assert.equal(nextTrack?.id, "b");
  assert.equal(manager.getState().currentTrack?.id, "b");

  const previousTrack = await manager.playPrevious();
  assert.equal(previousTrack?.id, "a");
  assert.equal(manager.getState().currentTrack?.id, "a");
});

test("setVolume clamps values and forwards them to the adapter", () => {
  const adapter = new FakeMediaAdapter();
  const manager = new PlayerManager([createTrack("a")], adapter);

  manager.setVolume(150);
  manager.setVolume(-20);

  assert.equal(manager.getState().volume, 0);
  assert.deepEqual(adapter.volumeHistory, [100, 0]);
});

test("shuffle preserves current track and queue membership", () => {
  const originalRandom = Math.random;
  const randomValues = [0.1, 0.8, 0.3];
  let randomIndex = 0;

  Math.random = () => {
    const value = randomValues[randomIndex];
    randomIndex += 1;
    return value ?? 0.5;
  };

  try {
    const manager = new PlayerManager([createTrack("a"), createTrack("b"), createTrack("c"), createTrack("d")]);

    void manager.playById("c");
    manager.shuffle();

    const state = manager.getState();
    const sortedIds = state.queue.map((track) => track.id).sort();

    assert.equal(state.currentTrack?.id, "c");
    assert.deepEqual(sortedIds, ["a", "b", "c", "d"]);
  } finally {
    Math.random = originalRandom;
  }
});

test("play resets loading when the adapter rejects", async () => {
  const adapter = new FakeMediaAdapter();
  adapter.shouldReject = true;

  const manager = new PlayerManager([createTrack("a")], adapter);

  await assert.rejects(async () => manager.play());
  assert.equal(manager.getState().loading, false);
  assert.equal(manager.getState().isPlaying, false);
});
