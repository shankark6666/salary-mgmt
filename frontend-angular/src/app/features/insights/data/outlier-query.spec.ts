import { outlierSearchParams, parseOutlierQuery } from "./outlier-query";

const parse = (s: string) => parseOutlierQuery(new URLSearchParams(s));

describe("outlier URL state", () => {
  it("defaults to 25% across everyone", () => {
    expect(parse("")).toEqual({ threshold: 25, country: null, jobTitleId: null, page: 0 });
  });

  it("only accepts the offered thresholds", () => {
    expect(parse("threshold=50").threshold).toBe(50);
    expect(parse("threshold=1").threshold).toBe(25);
    expect(parse("threshold=abc").threshold).toBe(25);
  });

  it("round-trips through the URL", () => {
    const query = { threshold: 15, country: "IN", jobTitleId: 5, page: 2 };
    expect(parse(outlierSearchParams(query).toString())).toEqual(query);
  });
});
