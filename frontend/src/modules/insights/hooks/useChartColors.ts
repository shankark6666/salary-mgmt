"use client";

import { useSyncExternalStore } from "react";

/**
 * SVG presentation attributes do not reliably resolve CSS variables, so chart colours are read
 * from the tokens in globals.css and re-read when the OS switches between light and dark.
 */
export interface ChartColors {
  series: string;
  band: string;
  below: string;
  above: string;
  grid: string;
  axis: string;
  muted: string;
}

const FALLBACK: ChartColors = {
  series: "#2a78d6", band: "#86b6ef", below: "#2a78d6", above: "#e34948",
  grid: "#e1e0d9", axis: "#c3c2b7", muted: "#6b6a66"
};

let cached: ChartColors = FALLBACK;
let cachedKey = "";

function read(): ChartColors {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const next: ChartColors = {
    series: v("--chart-series-1", FALLBACK.series),
    band: v("--chart-band", FALLBACK.band),
    below: v("--chart-below", FALLBACK.below),
    above: v("--chart-above", FALLBACK.above),
    grid: v("--chart-grid", FALLBACK.grid),
    axis: v("--chart-axis", FALLBACK.axis),
    muted: v("--chart-muted", FALLBACK.muted)
  };
  const key = Object.values(next).join();
  if (key !== cachedKey) {
    cached = next;
    cachedKey = key;
  }
  return cached;
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function useChartColors() {
  return useSyncExternalStore(subscribe, read, () => FALLBACK);
}
