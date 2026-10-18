/**
 * Money is formatted for display only — the UI never does arithmetic on it (ADR-0003).
 * Grouping follows the currency's home convention, so rupees read as lakhs: ₹29,17,950.
 */
const LOCALE_BY_CURRENCY: Record<string, string> = {
  INR: "en-IN",
  EUR: "de-DE",
  BRL: "pt-BR"
};

function localeFor(currency: string) {
  return LOCALE_BY_CURRENCY[currency] ?? "en-US";
}

export function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined) {
    return "—";
  }
  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

/** For chart axes and tiles: "$1.2M", "₹29L". */
export function formatMoneyCompact(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined) {
    return "—";
  }
  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1
  }).format(amount);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/** ISO date (yyyy-mm-dd) to "1 Mar 2024", without timezone shifts. */
export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year!, month! - 1, day!)));
}
