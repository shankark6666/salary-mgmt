import { request } from "@shared/api/client";
import type { ReferenceData } from "../types/reference.types";

export const referenceApi = {
  get: () => request<ReferenceData>({ url: "/api/v1/reference-data" })
};
