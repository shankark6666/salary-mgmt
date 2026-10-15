import { useQuery } from "@tanstack/react-query";
import { referenceApi } from "../api/reference.api";

/** Countries, departments and titles change rarely: fetch once per session. */
export function useReferenceData() {
  return useQuery({
    queryKey: ["reference-data"],
    queryFn: referenceApi.get,
    staleTime: Infinity
  });
}
