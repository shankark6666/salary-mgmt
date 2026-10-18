import { deviationWidth, sharedScale, toPercent } from "./bands";

describe("sharedScale", () => {
  it("spans the lowest low to the highest high, padded so end marks are not clipped", () => {
    const scale = sharedScale([{ low: 50, high: 80 }, { low: 30, high: 130 }])!;
    expect(scale).toEqual({ min: 26, max: 134 });
    expect(toPercent(30, scale)).toBeGreaterThan(0);
    expect(toPercent(130, scale)).toBeLessThan(100);
  });

  it("never divides by zero when every value is equal", () => {
    const scale = sharedScale([{ low: 50, high: 50 }])!;
    expect(toPercent(50, scale)).toBe(50);
  });

  it("is null without rows", () => {
    expect(sharedScale([])).toBeNull();
  });
});

describe("toPercent", () => {
  const scale = { min: 100, max: 200 };

  it("maps values linearly onto the track", () => {
    expect(toPercent(150, scale)).toBe(50);
  });

  it("clamps outside the scale", () => {
    expect(toPercent(50, scale)).toBe(0);
    expect(toPercent(250, scale)).toBe(100);
  });
});

describe("deviationWidth", () => {
  it("fills half the track at the page's largest deviation", () => {
    expect(deviationWidth(-60, 60)).toBe(50);
    expect(deviationWidth(30, 60)).toBe(25);
  });

  it("is zero when there is nothing to show", () => {
    expect(deviationWidth(10, 0)).toBe(0);
  });
});
