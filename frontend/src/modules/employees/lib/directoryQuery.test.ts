import { DEFAULT_QUERY, nextSort, parseDirectoryQuery, toSearchParams } from "./directoryQuery";

const parse = (search: string) => parseDirectoryQuery(new URLSearchParams(search));

describe("parseDirectoryQuery", () => {
  it("returns defaults for an empty URL", () => {
    expect(parse("")).toEqual(DEFAULT_QUERY);
  });

  it("reads every filter, converting the 1-based page", () => {
    expect(parse("q=sharma&country=IN&departmentId=1&jobTitleId=5&status=ALL&page=3&size=50&sort=salaryUsd&direction=DESC"))
      .toEqual({
        q: "sharma", country: "IN", departmentId: 1, jobTitleId: 5, status: "ALL",
        page: 2, size: 50, sort: "salaryUsd", direction: "DESC"
      });
  });

  it.each([
    ["country=india", { country: null }],
    ["departmentId=-1", { departmentId: null }],
    ["jobTitleId=abc", { jobTitleId: null }],
    ["status=FIRED", { status: "ACTIVE" }],
    ["page=0", { page: 0 }],
    ["size=10000", { size: 25 }],
    ["sort=password", { sort: "name" }],
    ["direction=sideways", { direction: "ASC" }]
  ])("falls back to the default for %s", (search, expected) => {
    expect(parse(search)).toMatchObject(expected);
  });

  it("caps very long search text", () => {
    expect(parse(`q=${"x".repeat(500)}`).q).toHaveLength(100);
  });
});

describe("toSearchParams", () => {
  it("writes nothing for the default view", () => {
    expect(toSearchParams(DEFAULT_QUERY).toString()).toBe("");
  });

  it("round-trips through the URL", () => {
    const query = { ...DEFAULT_QUERY, q: "lee", country: "SG", page: 4, sort: "hireDate" as const, direction: "DESC" as const };
    expect(parseDirectoryQuery(toSearchParams(query))).toEqual(query);
  });
});

describe("nextSort", () => {
  it("flips direction on the active column", () => {
    expect(nextSort(DEFAULT_QUERY, "name")).toEqual({ sort: "name", direction: "DESC" });
  });

  it("starts salary and hire date highest-first", () => {
    expect(nextSort(DEFAULT_QUERY, "salaryUsd")).toEqual({ sort: "salaryUsd", direction: "DESC" });
    expect(nextSort(DEFAULT_QUERY, "hireDate")).toEqual({ sort: "hireDate", direction: "DESC" });
  });

  it("starts text columns A to Z", () => {
    expect(nextSort(DEFAULT_QUERY, "country")).toEqual({ sort: "country", direction: "ASC" });
  });
});
