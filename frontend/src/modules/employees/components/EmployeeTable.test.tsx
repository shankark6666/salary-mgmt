import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Employee } from "../types/employee.types";
import { EmployeeTable } from "./EmployeeTable";

const priya: Employee = {
  id: 7, employeeCode: "EMP-00007", fullName: "Priya Sharma", email: "priya@acme.com",
  countryCode: "IN", countryName: "India", currencyCode: "INR", departmentId: 1,
  departmentName: "Engineering", jobTitleId: 5, jobTitleName: "Senior Software Engineer",
  employmentType: "FULL_TIME", hireDate: "2024-03-01", salary: 2917950, salaryUsd: 35015.4,
  active: true, version: 0
};

function renderTable(overrides: Partial<Parameters<typeof EmployeeTable>[0]> = {}) {
  const onSort = vi.fn();
  render(
    <EmployeeTable employees={[priya]} loading={false} sort="name" direction="ASC" onSort={onSort} showStatus={false} {...overrides} />
  );
  return { onSort };
}

describe("EmployeeTable", () => {
  it("shows local salary with its USD equivalent and links to the employee", () => {
    renderTable();

    const row = screen.getByRole("row", { name: /Priya Sharma/ });
    expect(within(row).getByText("₹29,17,950")).toBeInTheDocument();
    expect(within(row).getByText("≈ $35,015")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Priya Sharma" })).toHaveAttribute("href", "/employees/7");
  });

  it("announces the sorted column to screen readers", () => {
    renderTable({ sort: "salaryUsd", direction: "DESC" });

    expect(screen.getByRole("columnheader", { name: /Salary/ })).toHaveAttribute("aria-sort", "descending");
    expect(screen.getByRole("columnheader", { name: /Employee/ })).toHaveAttribute("aria-sort", "none");
  });

  it("asks to sort when a header is clicked", async () => {
    const { onSort } = renderTable();

    await userEvent.click(screen.getByRole("button", { name: /Country/ }));

    expect(onSort).toHaveBeenCalledWith("country");
  });

  it("shows the status column only when inactive people can appear", () => {
    renderTable({ showStatus: true });

    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
