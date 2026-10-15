package com.acme.salary.insights.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SalaryScaleTest {

    @Test
    void snapsWidthToARoundNumber() {
        SalaryScale scale = SalaryScale.forRange(bd("52300"), bd("187900"), 10);

        assertThat(scale.width()).isEqualByComparingTo("20000");
        assertThat(scale.start()).isEqualByComparingTo("40000");
        assertThat(scale.bucketCount()).isEqualTo(8);
    }

    @Test
    void worksForLargeCurrencyAmounts() {
        SalaryScale scale = SalaryScale.forRange(bd("1000000"), bd("9500000"), 10);

        assertThat(scale.width()).isEqualByComparingTo("1000000");
        assertThat(scale.start()).isEqualByComparingTo("1000000");
        assertThat(scale.bucketCount()).isEqualTo(9);
    }

    @Test
    void singleValueGetsOneBucket() {
        SalaryScale scale = SalaryScale.forRange(bd("50000"), bd("50000"), 10);

        assertThat(scale.bucketCount()).isEqualTo(1);
        assertThat(scale.lowerBound(0)).isLessThanOrEqualTo(bd("50000"));
        assertThat(scale.upperBound(0)).isGreaterThan(bd("50000"));
    }

    @ParameterizedTest
    @CsvSource({
            "52300, 187900, 10",
            "1000000, 9500000, 10",
            "123.45, 98765.43, 20",
            "100000, 100000.01, 5",
            "0.01, 1, 3"})
    void bucketsAlwaysCoverTheWholeRange(String min, String max, int target) {
        SalaryScale scale = SalaryScale.forRange(bd(min), bd(max), target);

        assertThat(scale.start()).isLessThanOrEqualTo(bd(min));
        assertThat(scale.upperBound(scale.bucketCount() - 1)).isGreaterThan(bd(max));
        assertThat(scale.bucketIndex(bd(min))).isZero();
        assertThat(scale.bucketIndex(bd(max))).isEqualTo(scale.bucketCount() - 1);
        assertThat(scale.bucketCount()).isBetween(1, target * 2 + 1);
    }

    @ParameterizedTest
    @CsvSource({"13560, 20000", "10000, 10000", "4100, 5000", "0.3, 0.5", "760000, 1000000"})
    void niceStepRoundsUpToOneTwoOrFiveTimesAPowerOfTen(String raw, String expected) {
        assertThat(SalaryScale.niceStep(bd(raw))).isEqualByComparingTo(expected);
    }

    @Test
    void rejectsInvertedRange() {
        assertThatThrownBy(() -> SalaryScale.forRange(bd("10"), bd("5"), 10))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }
}
