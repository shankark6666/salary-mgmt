/**
 * Chart data ink from the CSS tokens in styles.scss (validated palette). Canvas cannot read
 * CSS variables, so values are resolved at draw time and re-read when the OS theme changes.
 */
export interface ChartColors {
  series: string;
  band: string;
  below: string;
  above: string;
  grid: string;
  axis: string;
  muted: string;
  surface: string;
  text: string;
}

export function readChartColors(): ChartColors {
  // Tokens may be light-dark() or other expressions canvas cannot parse. A probe element lets
  // the browser resolve each one to a plain rgb() colour for the current theme.
  const probe = document.createElement('span');
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const v = (name: string, fallback: string) => {
    probe.style.color = fallback;
    probe.style.color = `var(${name}, ${fallback})`;
    return getComputedStyle(probe).color || fallback;
  };
  try {
    return {
      series: v('--chart-series-1', '#2a78d6'),
      band: v('--chart-band', '#86b6ef'),
      below: v('--chart-below', '#2a78d6'),
      above: v('--chart-above', '#e34948'),
      grid: v('--chart-grid', '#e1e0d9'),
      axis: v('--chart-axis', '#c3c2b7'),
      muted: v('--chart-muted', '#6b6a66'),
      surface: v('--mat-sys-surface', '#ffffff'),
      text: v('--mat-sys-on-surface', '#1b1b1f'),
    };
  } finally {
    probe.remove();
  }
}
