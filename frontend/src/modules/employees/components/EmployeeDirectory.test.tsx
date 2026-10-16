import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { authApi } from "@modules/auth/api/auth.api";
import { referenceApi } from "@modules/reference/api/reference.api";
import { employeeApi } from "../api/employee.api";
import { EmployeeDirectory } from "./EmployeeDirectory";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/employees",
  useSearchParams: () => new URLSearchParams("country=IN")
}));
vi.mock("@modules/auth/api/auth.api", () => ({ authApi: { me: vi.fn() } }));
vi.mock("@modules/reference/api/reference.api", () => ({ referenceApi: { get: vi.fn() } }));
vi.mock("../api/employee.api", () => ({ employeeApi: { search: vi.fn() } }));

function renderAs(role: "HR_MANAGER" | "HR_ANALYST") {
  vi.mocked(authApi.me).mockResolvedValue({ username: "u", displayName: "U", role });
  vi.mocked(referenceApi.get).mockResolvedValue({ countries: [], departments: [], jobTitles: [], fxRatesAsOf: "2026-10-01" });
  vi.mocked(employeeApi.search).mockResolvedValue({ content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <EmployeeDirectory />
    </QueryClientProvider>
  );
}

describe("EmployeeDirectory", () => {
  it("lets managers add employees and export what they are looking at", async () => {
    renderAs("HR_MANAGER");

    expect(await screen.findByRole("button", { name: "Add employee" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Export CSV" })).toHaveAttribute(
      "href",
      expect.stringContaining("/api/v1/employees/export?country=IN")
    );
  });

  it("hides write actions from read-only analysts", async () => {
    renderAs("HR_ANALYST");

    await screen.findByText("No employees match");
    expect(screen.queryByRole("button", { name: "Add employee" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Export CSV" })).not.toBeInTheDocument();
  });

  it("queries with the filters from the URL", async () => {
    renderAs("HR_ANALYST");

    await screen.findByText("No employees match");
    expect(employeeApi.search).toHaveBeenCalledWith(expect.objectContaining({ country: "IN", status: "ACTIVE", page: 0 }));
  });
});
