package com.acme.salary.insights.domain;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/**
 * Histogram buckets a person can read: widths are 1, 2 or 5 × 10ⁿ and bucket edges are multiples
 * of the width, so a chart says "₹10L–₹20L" rather than "₹13,456.78–₹26,913.56".
 *
 * @param start       lower edge of the first bucket (≤ smallest salary)
 * @param width       size of every bucket
 * @param bucketCount number of buckets; together they cover [start, start + width × count)
 */
public record SalaryScale(BigDecimal start, BigDecimal width, int bucketCount) {

    public static SalaryScale forRange(BigDecimal min, BigDecimal max, int targetBuckets) {
        if (max.compareTo(min) < 0) {
            throw new IllegalArgumentException("max %s is below min %s".formatted(max, min));
        }
        BigDecimal range = max.subtract(min);
        BigDecimal raw = range.signum() > 0
                ? range.divide(BigDecimal.valueOf(targetBuckets), MathContext.DECIMAL64)
                : min.max(BigDecimal.ONE).divide(BigDecimal.valueOf(targetBuckets), MathContext.DECIMAL64);
        BigDecimal width = niceStep(raw);
        BigDecimal start = min.divide(width, 0, RoundingMode.FLOOR).multiply(width);
        int count = max.subtract(start).divide(width, 0, RoundingMode.FLOOR).intValueExact() + 1;
        return new SalaryScale(start, width, count);
    }

    /** Smallest of 1, 2, 5 × 10ⁿ that is ≥ {@code raw}. */
    static BigDecimal niceStep(BigDecimal raw) {
        int exponent = raw.precision() - raw.scale() - 1;
        BigDecimal power = BigDecimal.ONE.scaleByPowerOfTen(exponent);
        BigDecimal fraction = raw.divide(power, MathContext.DECIMAL64);
        BigDecimal nice;
        if (fraction.compareTo(BigDecimal.ONE) <= 0) {
            nice = BigDecimal.ONE;
        } else if (fraction.compareTo(BigDecimal.TWO) <= 0) {
            nice = BigDecimal.TWO;
        } else if (fraction.compareTo(BigDecimal.valueOf(5)) <= 0) {
            nice = BigDecimal.valueOf(5);
        } else {
            nice = BigDecimal.TEN;
        }
        return nice.multiply(power).stripTrailingZeros();
    }

    public int bucketIndex(BigDecimal value) {
        return value.subtract(start).divide(width, 0, RoundingMode.FLOOR).intValueExact();
    }

    public BigDecimal lowerBound(int index) {
        return start.add(width.multiply(BigDecimal.valueOf(index)));
    }

    public BigDecimal upperBound(int index) {
        return lowerBound(index + 1);
    }
}
