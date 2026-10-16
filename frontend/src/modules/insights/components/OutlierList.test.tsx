import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { referenceApi } from "@modules/reference/api/reference.api";
import { insightsApi } from "../api/insights.api";
import { OutlierList } from "./OutlierList";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/insights/outliers",
  useSearchParams: () => new URLSearchParams(search)
}));
vi.mock("@modules/reference/api/reference.api", () => ({ referenceApi: { get: vi.fn() } }));
vi.mock("../api/insights.api", () => ({ insightsApi: { outliers: vi.fn() } }));

const outlier = (employeeId: number, fullName: string, deviationPercent: number) => ({
  employeeId, employeeCode: `EMP-${employeeId}`, fullName, countryCode: "US", currencyCode: "USD",
  jobTitleId: 1, jobTitleName: "Associate", salary: 110900, peerMedian: 55200, deviationPercent, peerCount: 696
});

function renderList() {
  vi.mocked(referenceApi.get).mockResolvedValue({ countries: [], departments: [], jobTitles: [], fxRatesAsOf: "2026-10-01" });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OutlierList />
    </QueryClientProvider>
  );
}

describe("OutlierList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search = "";
  });

  it("states direction in words, not only colour", async () => {
    vi.mocked(insightsApi.outliers).mockResolvedValue({
      content: [outlier(1, "James Smith", 100.9), outlier(2, "Robert Hall", -50.2)],
      page: 0, size: 25, totalElements: 2, totalPages: 1
    });
    renderList();

    const above = await screen.findByRole("row", { name: /James Smith/ });
    expect(within(above).getByText("+100.9%")).toBeInTheDocument();
    expect(within(above).getByText(/above the peer median/)).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /Robert Hall/ })).getByText(/below the peer median/)).toBeInTheDocument();
  });

  it("queries with the threshold from the URL", async () => {
    search = "threshold=50&country=IN";
    vi.mocked(insightsApi.outliers).mockResolvedValue({ content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 });
    renderList();

    expect(await screen.findByText("No outliers at this threshold")).toBeInTheDocument();
    expect(insightsApi.outliers).toHaveBeenCalledWith({ threshold: 50, country: "IN", jobTitleId: null, page: 0 });
  });

  it("links each person to their record", async () => {
    vi.mocked(insightsApi.outliers).mockResolvedValue({
      content: [outlier(9405, "James Smith", 100.9)], page: 0, size: 25, totalElements: 1, totalPages: 1
    });
    renderList();

    expect(await screen.findByRole("link", { name: "James Smith" })).toHaveAttribute("href", "/employees/9405");
  });
});
