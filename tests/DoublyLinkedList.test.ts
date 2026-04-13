import test from "node:test";
import assert from "node:assert/strict";

import { Loop } from "../src/structures/Loop";
import type { ITrack } from "../src/types";

const createTrack = (id: string): ITrack => ({
  id,
  videoId: `video-${id}`,
  title: `Track ${id}`,
  artist: `Artist ${id}`,
  thumbnailUrl: `https://img.youtube.com/${id}.jpg`,
});

test("insertAtStart and insertAtEnd maintain order", () => {
  const list = new Loop<ITrack>((track) => track.id);

  list.insertAtStart(createTrack("b"));
  list.insertAtStart(createTrack("a"));
  list.insertAtEnd(createTrack("c"));

  assert.deepEqual(list.toArray().map((track) => track.id), ["a", "b", "c"]);
  assert.equal(list.size(), 3);
  assert.equal(list.getCurrent()?.id, "b");
});

test("insertAtPosition delegates correctly without corrupting length", () => {
  const list = new Loop<ITrack>((track) => track.id);

  list.insertAtPosition(0, createTrack("b"));
  list.insertAtPosition(99, createTrack("d"));
  list.insertAtPosition(1, createTrack("c"));
  list.insertAtPosition(0, createTrack("a"));

  assert.deepEqual(list.toArray().map((track) => track.id), ["a", "b", "c", "d"]);
  assert.equal(list.size(), 4);
});

test("removeById updates current using next then previous fallback", () => {
  const list = new Loop<ITrack>((track) => track.id);

  list.insertAtEnd(createTrack("a"));
  list.insertAtEnd(createTrack("b"));
  list.insertAtEnd(createTrack("c"));

  list.setCurrentById("b");
  list.removeById("b");
  assert.equal(list.getCurrent()?.id, "c");

  list.removeById("c");
  assert.equal(list.getCurrent()?.id, "a");

  list.removeById("a");
  assert.equal(list.getCurrent(), null);
  assert.equal(list.isEmpty(), true);
});

test("getNext and getPrevious wrap in circular mode", () => {
  const list = new Loop<ITrack>((track) => track.id, true);

  list.insertAtEnd(createTrack("a"));
  list.insertAtEnd(createTrack("b"));
  list.insertAtEnd(createTrack("c"));

  list.setCurrentById("c");
  assert.equal(list.getNext()?.id, "a");

  list.setCurrentById("a");
  assert.equal(list.getPrevious()?.id, "c");
});

test("toggleCircular preserves traversal and toArray stays finite", () => {
  const list = new Loop<ITrack>((track) => track.id);

  list.insertAtEnd(createTrack("a"));
  list.insertAtEnd(createTrack("b"));
  list.insertAtEnd(createTrack("c"));
  list.setCurrentById("c");

  assert.equal(list.getNext(), null);

  list.toggleCircular();
  assert.equal(list.getNext()?.id, "a");
  assert.deepEqual(list.toArray().map((track) => track.id), ["a", "b", "c"]);

  list.toggleCircular();
  list.setCurrentById("a");
  assert.equal(list.getPrevious(), null);
});
