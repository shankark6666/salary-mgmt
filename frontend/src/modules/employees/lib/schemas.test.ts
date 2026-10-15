import { changeSalarySchema, createEmployeeSchema, percentChange } from "./schemas";

const TODAY = "2026-10-15";

describe("createEmployeeSchema", () => {
  const schema = createEmployeeSchema(TODAY);
  const valid = {
    fullName: "Jane Doe", email: "jane@acme.com", countryCode: "IN", departmentId: "1",
    jobTitleId: "5", employmentType: "FULL_TIME", hireDate: "2024-03-01", salary: "2900000"
  };

  it("accepts a complete hire and coerces select values to numbers", () => {
    const result = schema.parse(valid);
    expect(result.departmentId).toBe(1);
    expect(result.jobTitleId).toBe(5);
  });

  it.each([
    ["salary", "0", "greater than zero"],
    ["salary", "1000.555", "up to 2 decimals"],
    ["salary", "12,000", "up to 2 decimals"],
    ["hireDate", "2026-10-16", "future"],
    ["email", "jane@", "valid email"],
    ["departmentId", "", "Choose a department"],
    ["countryCode", "", "Choose a country"]
  ])("rejects %s = %s", (field, value, message) => {
    const result = schema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.flatten().fieldErrors)).toContain(message);
  });
});

describe("changeSalarySchema", () => {
  const schema = changeSalarySchema({ currentSalary: 85000, earliestDate: "2025-03-01", today: TODAY });
  const valid = { newSalary: "90000", effectiveDate: "2026-10-01", reason: "Annual review" };

  it("accepts a valid change", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["newSalary", "85000.00", "current salary"],
    ["effectiveDate", "2026-10-16", "future"],
    ["effectiveDate", "2025-02-28", "before the latest change (1 Mar 2025)"],
    ["reason", "  ", "Say why"]
  ])("rejects %s = %s", (field, value, message) => {
    const result = schema.safeParse({ ...valid, [field]: value });
    expect(JSON.stringify(result.error?.flatten().fieldErrors)).toContain(message);
  });

  it("allows a change on the same day as the latest one", () => {
    expect(schema.safeParse({ ...valid, effectiveDate: "2025-03-01" }).success).toBe(true);
  });
});

describe("percentChange", () => {
  it("previews the raise", () => {
    expect(percentChange(80000, "88000")).toBeCloseTo(10);
    expect(percentChange(80000, "72000")).toBeCloseTo(-10);
  });

  it("is null for incomplete input", () => {
    expect(percentChange(80000, "")).toBeNull();
    expect(percentChange(80000, "abc")).toBeNull();
  });
});
