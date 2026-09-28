import { describe, it, expect } from "vitest";
import { wallItems } from "./shared";
import { RATES } from "./rates";
import type { WallConfig } from "./types";

function findItem(items: ReturnType<typeof wallItems>, name: string) {
  return items.find((i) => i.name === name);
}

describe("wallItems - horizontal 2x6/2x3 board wall (any product)", () => {
  it("plain 2x6-only wall: board count fills the height with the gap between boards", () => {
    const wall: WallConfig = { position: "side", length: 10, height: 3, gapIn: 1, alternating2x3: false, color: "White" };
    const items = wallItems([wall]);
    // height=3ft, gap=1/12ft, board=0.5ft -> N = ceil((3+1/12)/(0.5+1/12)) = ceil(3.0833/0.5833) = ceil(5.29) = 6
    const boards = findItem(items, "Wall #1 - 2x6 Boards");
    expect(boards).toBeTruthy();
    expect(boards!.qty).toBe(6);
    expect(boards!.length).toBe(10);
    expect(boards!.rate).toBe(RATES.rafter_2x6_032_ft);
    expect(findItem(items, "Wall #1 - 2x3 Boards")).toBeUndefined();
  });

  it("full-length bracket: 2 per wall, priced off the wall's own length, not height", () => {
    const wall: WallConfig = { position: "front", length: 12, height: 4, gapIn: 1, alternating2x3: false, color: "Ebony" };
    const items = wallItems([wall]);
    const bracket = findItem(items, "Wall #1 - Outside Brackets");
    expect(bracket).toBeTruthy();
    expect(bracket!.qty).toBe(2);
    expect(bracket!.length).toBe(12);
    expect(bracket!.rate).toBe(RATES.wall_outside_brkt_2x6_ft);
    expect(bracket!.amount).toBeCloseTo(2 * 12 * RATES.wall_outside_brkt_2x6_ft, 2);
  });

  it("alternating 2x3: adds a matching 2x3 line, same board count as the 2x6s", () => {
    const wall: WallConfig = { position: "back", length: 8, height: 4, gapIn: 1, alternating2x3: true, color: "White" };
    const items = wallItems([wall]);
    const boards6 = findItem(items, "Wall #1 - 2x6 Boards");
    const boards3 = findItem(items, "Wall #1 - 2x3 Boards");
    expect(boards6).toBeTruthy();
    expect(boards3).toBeTruthy();
    expect(boards3!.qty).toBe(boards6!.qty);
    expect(boards3!.rate).toBe(RATES.lattice_2x3_ft);
  });

  it("multiple walls number independently and each get their own 2 brackets", () => {
    const walls: WallConfig[] = [
      { position: "side", length: 10, height: 3, gapIn: 1, alternating2x3: false, color: "White" },
      { position: "back", length: 6, height: 3, gapIn: 1, alternating2x3: false, color: "White" },
    ];
    const items = wallItems(walls);
    expect(findItem(items, "Wall #1 - 2x6 Boards")).toBeTruthy();
    expect(findItem(items, "Wall #2 - 2x6 Boards")).toBeTruthy();
    expect(findItem(items, "Wall #1 - Outside Brackets")!.length).toBe(10);
    expect(findItem(items, "Wall #2 - Outside Brackets")!.length).toBe(6);
  });

  it("a wall with 0 length or height is skipped entirely", () => {
    const walls: WallConfig[] = [
      { position: "side", length: 0, height: 3, gapIn: 1, alternating2x3: false, color: "White" },
      { position: "side", length: 10, height: 0, gapIn: 1, alternating2x3: false, color: "White" },
    ];
    expect(wallItems(walls)).toEqual([]);
  });
});
