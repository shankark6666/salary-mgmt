import { AxiosError, AxiosHeaders } from "axios";
import { ApiError, toApiError } from "./errors";

function axiosError(status: number, data: unknown) {
  return new AxiosError("failed", "ERR", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data
  });
}

describe("toApiError", () => {
  it("keeps the backend's code, message and field errors", () => {
    const error = toApiError(
      axiosError(400, {
        success: false,
        errorCode: "VALIDATION_FAILED",
        message: "Request validation failed",
        fieldErrors: { email: "must be a well-formed email address" }
      })
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.fieldErrors.email).toBe("must be a well-formed email address");
  });

  it("flags 409 as a conflict", () => {
    expect(toApiError(axiosError(409, { errorCode: "CONFLICT", message: "x" })).isConflict).toBe(true);
  });

  it("explains network failures in plain words", () => {
    const error = toApiError(new AxiosError("Network Error", "ERR_NETWORK"));

    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).toMatch(/cannot reach the server/i);
  });

  it("never surfaces raw non-envelope bodies", () => {
    const error = toApiError(axiosError(502, "<html>Bad gateway</html>"));

    expect(error.message).toBe("Something went wrong. Please try again.");
  });
});
