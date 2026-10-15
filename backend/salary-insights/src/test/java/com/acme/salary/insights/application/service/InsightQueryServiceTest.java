package com.acme.salary.insights.application.service;

import com.acme.salary.common.exception.ResourceNotFoundException;
import com.acme.salary.insights.application.model.OutlierCriteria;
import com.acme.salary.insights.application.model.SalaryDistribution;
import com.acme.salary.insights.application.port.out.InsightReadModel;
import com.acme.salary.insights.domain.SalaryScale;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InsightQueryServiceTest {

    private static final InsightReadModel.Country US =
            new InsightReadModel.Country("US", "United States", "USD");

    @Mock
    private InsightReadModel readModel;

    @InjectMocks
    private InsightQueryService service;

    @Test
    void distributionIncludesEmptyBucketsSoTheChartHasNoGaps() {
        when(readModel.findCountry("US")).thenReturn(Optional.of(US));
        when(readModel.salaryRange("US")).thenReturn(
                new InsightReadModel.SalaryRange(3, new BigDecimal("52300"), new BigDecimal("187900")));
        // Scale: start 40,000, width 20,000, 8 buckets. People in buckets 0 and 7 only.
        when(readModel.bucketCounts(eq("US"), any(SalaryScale.class))).thenReturn(Map.of(0, 2L, 7, 1L));

        SalaryDistribution distribution = service.distribution("US", 10);

        assertThat(distribution.bucketWidth()).isEqualByComparingTo("20000");
        assertThat(distribution.buckets()).hasSize(8);
        assertThat(distribution.buckets()).extracting(SalaryDistribution.Bucket::count)
                .containsExactly(2L, 0L, 0L, 0L, 0L, 0L, 0L, 1L);
        assertThat(distribution.buckets().get(0).lower()).isEqualByComparingTo("40000");
        assertThat(distribution.buckets().get(7).upper()).isEqualByComparingTo("200000");
        assertThat(distribution.headcount()).isEqualTo(3);
    }

    @Test
    void distributionForCountryWithNobodyIsEmptyNotAnError() {
        when(readModel.findCountry("US")).thenReturn(Optional.of(US));
        when(readModel.salaryRange("US")).thenReturn(new InsightReadModel.SalaryRange(0, null, null));

        SalaryDistribution distribution = service.distribution("US", 10);

        assertThat(distribution.buckets()).isEmpty();
        verify(readModel, never()).bucketCounts(any(), any());
    }

    @Test
    void unknownCountryIsNotFound() {
        when(readModel.findCountry("XX")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.rolesInCountry("XX"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("XX");
    }

    @Test
    void unknownJobTitleIsNotFound() {
        when(readModel.findJobTitle(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.roleAcrossCountries(99))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void outliersValidateCountryFilterBeforeQuerying() {
        when(readModel.findCountry("XX")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.outliers(new OutlierCriteria(30, "XX", null, 0, 25)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(readModel, never()).outliers(any());
    }
}
