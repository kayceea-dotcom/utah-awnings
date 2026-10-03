import { describe, it, expect } from "vitest";
import { roundUpToBag } from "./shared";

describe("roundUpToBag - screws only come in bags of 100", () => {
  it("rounds up to the next full bag", () => {
    expect(roundUpToBag(1)).toBe(100);
    expect(roundUpToBag(40)).toBe(100);
    expect(roundUpToBag(101)).toBe(200);
    expect(roundUpToBag(235)).toBe(300);
  });

  it("leaves an exact multiple alone", () => {
    expect(roundUpToBag(100)).toBe(100);
    expect(roundUpToBag(300)).toBe(300);
  });

  it("returns 0 for 0 so no empty line gets a phantom bag", () => {
    expect(roundUpToBag(0)).toBe(0);
  });
});
