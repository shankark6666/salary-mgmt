import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@shared/api/errors";
import { authApi } from "../api/auth.api";
import { LoginForm } from "./LoginForm";

const replace = vi.fn();
let nextParam: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => nextParam })
}));

vi.mock("../api/auth.api", () => ({
  authApi: { login: vi.fn(), me: vi.fn(), logout: vi.fn() }
}));

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <LoginForm />
    </QueryClientProvider>
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextParam = null;
  });

  it("asks for both fields before calling the server", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter your username")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it("signs in and returns to the page the user came from", async () => {
    nextParam = "/employees?country=IN";
    vi.mocked(authApi.login).mockResolvedValue({ username: "hr", displayName: "HR", role: "HR_MANAGER" });
    renderForm();

    await userEvent.type(screen.getByLabelText("Username"), "hr.manager");
    await userEvent.type(screen.getByLabelText("Password"), "secret-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(authApi.login).toHaveBeenCalledWith("hr.manager", "secret-password");
    expect(replace).toHaveBeenCalledWith("/employees?country=IN");
  });

  it("ignores an external next= target", async () => {
    nextParam = "https://evil.example";
    vi.mocked(authApi.login).mockResolvedValue({ username: "hr", displayName: "HR", role: "HR_MANAGER" });
    renderForm();

    await userEvent.type(screen.getByLabelText("Username"), "hr.manager");
    await userEvent.type(screen.getByLabelText("Password"), "secret-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(replace).toHaveBeenCalledWith("/insights");
  });

  it("shows the server's generic message on failure", async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError(401, "INVALID_CREDENTIALS", "Invalid username or password")
    );
    renderForm();

    await userEvent.type(screen.getByLabelText("Username"), "hr.manager");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password");
    expect(replace).not.toHaveBeenCalled();
  });
});
