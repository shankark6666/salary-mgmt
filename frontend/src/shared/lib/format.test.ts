import { formatDate, formatMoney, formatMoneyCompact, formatPercent } from "./format";

describe("formatMoney", () => {
  it("uses Indian grouping for rupees", () => {
    expect(formatMoney(2917950, "INR")).toBe("₹29,17,950");
  });

  it("formats dollars without cents", () => {
    expect(formatMoney(157250.4, "USD")).toBe("$157,250");
  });

  it("shows a dash for missing values instead of $0", () => {
    expect(formatMoney(null, "USD")).toBe("—");
    expect(formatMoney(undefined, "USD")).toBe("—");
  });
});

describe("formatMoneyCompact", () => {
  it("abbreviates large amounts", () => {
    expect(formatMoneyCompact(735229294, "USD")).toBe("$735.2M");
  });
});

describe("formatPercent", () => {
  it("signs positive and negative deviations", () => {
    expect(formatPercent(60)).toBe("+60.0%");
    expect(formatPercent(-20)).toBe("-20.0%");
  });
});

describe("formatDate", () => {
  it("never shifts the day across timezones", () => {
    expect(formatDate("2024-03-01")).toBe("1 Mar 2024");
  });
});
