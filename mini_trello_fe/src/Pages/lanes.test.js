import { describe, expect, test } from "vitest";
import { groupIntoLanes, moveBetweenLanes } from "./lanes";

const card = (id, status, position) => ({ id, title: id, description: "", status, position });

describe("groupIntoLanes", () => {
  test("sorts each lane by position and ignores unknown statuses", () => {
    const lanes = groupIntoLanes([card("b", "todo", 2), card("x", "archived", 1), card("a", "todo", 1)]);
    expect(lanes.todo.map((c) => c.id)).toEqual(["a", "b"]);
    expect(lanes["in-progress"]).toEqual([]);
    expect(Object.keys(lanes)).toEqual(["todo", "in-progress", "done"]);
  });
});

describe("moveBetweenLanes", () => {
  const lanes = groupIntoLanes([card("a", "todo", 1), card("b", "todo", 2), card("c", "done", 1)]);

  test("reorders inside a lane without touching the original", () => {
    const next = moveBetweenLanes(lanes, { droppableId: "todo", index: 1 }, { droppableId: "todo", index: 0 });
    expect(next.todo.map((c) => c.id)).toEqual(["b", "a"]);
    expect(lanes.todo.map((c) => c.id)).toEqual(["a", "b"]);
  });

  test("moves across lanes at the drop index and updates the status", () => {
    const next = moveBetweenLanes(lanes, { droppableId: "todo", index: 0 }, { droppableId: "done", index: 0 });
    expect(next.todo.map((c) => c.id)).toEqual(["b"]);
    expect(next.done.map((c) => [c.id, c.status])).toEqual([["a", "done"], ["c", "done"]]);
  });
});
