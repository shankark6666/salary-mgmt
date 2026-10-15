import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@shared/api/errors";
import { employeeApi } from "../api/employee.api";
import type { Employee } from "../types/employee.types";
import { ChangeSalaryDialog } from "./ChangeSalaryDialog";

vi.mock("../api/employee.api", () => ({ employeeApi: { changeSalary: vi.fn() } }));
vi.mock("@shared/lib/dates", () => ({ todayIso: () => "2026-10-15" }));

const employee = {
  id: 7, fullName: "Priya Sharma", salary: 80000, currencyCode: "USD", version: 3
} as Employee;

function renderDialog() {
  const onClose = vi.fn();
  const onReload = vi.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ChangeSalaryDialog employee={employee} latestChangeDate="2025-03-01" open onClose={onClose} onReload={onReload} />
    </QueryClientProvider>
  );
  return { onClose, onReload };
}

const salaryInput = () => screen.getByLabelText("New annual salary (USD)");

describe("ChangeSalaryDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("previews the percentage change as the amount is typed", async () => {
    renderDialog();

    await userEvent.type(salaryInput(), "88000");

    expect(screen.getByText("+10.0% vs current salary")).toBeInTheDocument();
  });

  it("warns about changes large enough to be a typo", async () => {
    renderDialog();

    await userEvent.type(salaryInput(), "8000");

    expect(screen.getByText("-90.0% vs current salary")).toBeInTheDocument();
    expect(screen.getByText(/extra or missing zero/)).toBeInTheDocument();
  });

  it("does not warn about an ordinary raise", async () => {
    renderDialog();

    await userEvent.type(salaryInput(), "84000");

    expect(screen.queryByText(/extra or missing zero/)).not.toBeInTheDocument();
  });

  it("sends the amount, date, reason and the version the user was looking at", async () => {
    vi.mocked(employeeApi.changeSalary).mockResolvedValue(employee);
    const { onClose } = renderDialog();

    await userEvent.type(salaryInput(), "88000");
    await userEvent.click(screen.getByRole("button", { name: "Promotion" }));
    await userEvent.click(screen.getByRole("button", { name: "Record change" }));

    expect(employeeApi.changeSalary).toHaveBeenCalledWith(7, {
      version: 3, newSalary: 88000, effectiveDate: "2026-10-15", reason: "Promotion"
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("blocks an unchanged salary without calling the server", async () => {
    renderDialog();

    await userEvent.type(salaryInput(), "80000");
    await userEvent.type(screen.getByLabelText("Reason"), "Review");
    await userEvent.click(screen.getByRole("button", { name: "Record change" }));

    expect(await screen.findByText("That is the current salary")).toBeInTheDocument();
    expect(employeeApi.changeSalary).not.toHaveBeenCalled();
  });

  it("offers a reload when someone else changed the employee first", async () => {
    vi.mocked(employeeApi.changeSalary).mockRejectedValue(
      new ApiError(409, "CONFLICT", "This employee was changed by someone else. Reload and try again.")
    );
    const { onReload } = renderDialog();

    await userEvent.type(salaryInput(), "88000");
    await userEvent.type(screen.getByLabelText("Reason"), "Annual review");
    await userEvent.click(screen.getByRole("button", { name: "Record change" }));
    await userEvent.click(await screen.findByRole("button", { name: "Reload" }));

    expect(onReload).toHaveBeenCalled();
  });

  it("puts server field errors on the matching input", async () => {
    vi.mocked(employeeApi.changeSalary).mockRejectedValue(
      new ApiError(400, "VALIDATION_FAILED", "Request validation failed", { reason: "size must be between 0 and 500" })
    );
    renderDialog();

    await userEvent.type(salaryInput(), "88000");
    await userEvent.type(screen.getByLabelText("Reason"), "Annual review");
    await userEvent.click(screen.getByRole("button", { name: "Record change" }));

    expect(await screen.findByText("size must be between 0 and 500")).toBeInTheDocument();
  });
});
