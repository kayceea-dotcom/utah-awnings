import { describe, it, expect } from "vitest";
import { wrapColumnSizeFt, resolvePostXs } from "./geometry";

describe("wrapColumnSizeFt", () => {
  it("a 2x6 kit makes a 5.5in column, a 3x8 kit a 7.25in one, no kit means the bare post", () => {
    expect(wrapColumnSizeFt("2x6") * 12).toBeCloseTo(5.5);
    expect(wrapColumnSizeFt("3x8") * 12).toBeCloseTo(7.25);
    expect(wrapColumnSizeFt("none")).toBe(0);
  });
});

describe("resolvePostXs", () => {
  it("uses stored spots (made relative to the run) while they fit, else the fallback", () => {
    expect(resolvePostXs([15, 20], 2, 14, 8, [1, 2])).toEqual([1, 6]);
    expect(resolvePostXs([15, 40], 2, 14, 8, [1, 2])).toEqual([1, 2]);
    expect(resolvePostXs([15], 2, 14, 8, [1, 2])).toEqual([1, 2]);
    expect(resolvePostXs(undefined, 2, 0, 8, [1, 2])).toEqual([1, 2]);
  });
});
