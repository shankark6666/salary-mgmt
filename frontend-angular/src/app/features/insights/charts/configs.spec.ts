import type { ChartColors } from './chart-colors';
import { countryMedianConfig, distributionConfig, roleComparisonConfig } from './configs';

const colors: ChartColors = {
  series: '#2a78d6', band: '#86b6ef', below: '#2a78d6', above: '#e34948', grid: '#e1e0d9',
  axis: '#c3c2b7', muted: '#6b6a66', surface: '#ffffff', text: '#1b1b1f',
};

const country = (countryName: string, medianUsd: number) => ({
  countryCode: countryName.slice(0, 2).toUpperCase(), countryName, currencyCode: 'USD', headcount: 10,
  min: 1, median: medianUsd, average: medianUsd, max: medianUsd, medianUsd, averageUsd: medianUsd, payrollUsd: 1,
});

describe('countryMedianConfig', () => {
  const config = countryMedianConfig([country('India', 23622), country('United States', 104100), country('Germany', 76410)], colors);

  it('sorts countries by median, highest first', () => {
    expect(config.data.labels).toEqual(['United States', 'Germany', 'India']);
    expect(config.data.datasets[0]!.data).toEqual([104100, 76410, 23622]);
  });

  it('draws one series in the validated data blue, as thin horizontal bars', () => {
    expect(config.data.datasets[0]!.backgroundColor).toBe('#2a78d6');
    expect(config.options!.indexAxis).toBe('y');
    expect((config.data.datasets[0] as { maxBarThickness: number }).maxBarThickness).toBeLessThanOrEqual(24);
  });
});

describe('distributionConfig', () => {
  it('labels buckets by their lower bound in local currency', () => {
    const config = distributionConfig({
      countryCode: 'IN', currencyCode: 'INR', headcount: 3, bucketWidth: 500000,
      buckets: [{ lower: 500000, upper: 1000000, count: 2 }, { lower: 1000000, upper: 1500000, count: 1 }],
    }, colors);

    expect(config.data.labels).toEqual(['₹5L', '₹10L']);
    expect(config.data.datasets[0]!.data).toEqual([2, 1]);
  });
});

describe('roleComparisonConfig', () => {
  const rows = [
    { countryCode: 'IN', countryName: 'India', currencyCode: 'INR', headcount: 218, medianLocal: 2917950, p25Usd: 32406, medianUsd: 35015, p75Usd: 38434 },
    { countryCode: 'US', countryName: 'United States', currencyCode: 'USD', headcount: 252, medianLocal: 157250, p25Usd: 143775, medianUsd: 157250, p75Usd: 172850 },
  ];
  const config = roleComparisonConfig(rows, colors);

  it('draws the middle-50% band and the median for each country, highest median first', () => {
    expect(config.data.labels).toEqual(['United States', 'India']);
    expect(config.data.datasets[0]!.data).toEqual([[143775, 172850], [32406, 38434]]);
    expect(config.data.datasets[1]!.data).toEqual([{ x: 157250, y: 0 }, { x: 35015, y: 1 }]);
  });

  it('uses the lighter band step and a surface ring around the median', () => {
    expect(config.data.datasets[0]!.backgroundColor).toBe('#86b6ef');
    expect((config.data.datasets[1] as { pointBorderColor: string }).pointBorderColor).toBe('#ffffff');
  });
});
