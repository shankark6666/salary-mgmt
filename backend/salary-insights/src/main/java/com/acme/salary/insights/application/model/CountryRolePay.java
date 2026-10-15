package com.acme.salary.insights.application.model;

import java.util.List;

public record CountryRolePay(String countryCode, String countryName, String currencyCode,
                             List<RolePayStats> roles) {
}
