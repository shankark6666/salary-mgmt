import type { OutlierQuery } from "../types/insights.types";

export const THRESHOLDS = [15, 25, 35, 50] as const;
const DEFAULT_THRESHOLD = 25;

interface ParamSource {
  get(name: string): string | null;
}

function positiveInt(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 && Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseOutlierQuery(params: ParamSource): OutlierQuery {
  const threshold = positiveInt(params.get("threshold"));
  const country = params.get("country");
  return {
    threshold: threshold !== null && (THRESHOLDS as readonly number[]).includes(threshold) ? threshold : DEFAULT_THRESHOLD,
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    jobTitleId: positiveInt(params.get("jobTitleId")),
    page: Math.max(0, (positiveInt(params.get("page")) ?? 1) - 1)
  };
}

export function outlierSearchParams(query: OutlierQuery) {
  const params = new URLSearchParams();
  if (query.threshold !== DEFAULT_THRESHOLD) params.set("threshold", String(query.threshold));
  if (query.country) params.set("country", query.country);
  if (query.jobTitleId) params.set("jobTitleId", String(query.jobTitleId));
  if (query.page > 0) params.set("page", String(query.page + 1));
  return params;
}
