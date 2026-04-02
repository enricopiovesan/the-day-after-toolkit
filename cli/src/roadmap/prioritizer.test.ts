import { describe, expect, it } from "vitest";

import { multiplyAxes } from "./prioritizer.js";

describe("multiplyAxes", () => {
  it("multiplies all three axes together", () => {
    expect(multiplyAxes(3, 3, 1)).toBe(9);
  });

  it("returns zero when any axis is zero", () => {
    expect(multiplyAxes(3, 0, 3)).toBe(0);
  });

  it("does not add axes together", () => {
    expect(multiplyAxes(2, 2, 1)).not.toBe(5);
  });

  it("handles the minimum non-zero phase boundary", () => {
    expect(multiplyAxes(1, 1, 1)).toBe(1);
  });

  it("handles a representative phase-two score", () => {
    expect(multiplyAxes(2, 2, 2)).toBe(8);
  });
});
