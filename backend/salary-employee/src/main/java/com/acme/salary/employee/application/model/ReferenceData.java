package com.acme.salary.employee.application.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Everything the UI needs to populate filters and forms, in one request. */
public record ReferenceData(
        List<Country> countries,
        List<Department> departments,
        List<JobTitle> jobTitles,
        LocalDate fxRatesAsOf) {

    public record Country(String code, String name, String currencyCode, BigDecimal usdRate) {
    }

    public record Department(int id, String name) {
    }

    public record JobTitle(int id, String name, int level) {
    }
}
