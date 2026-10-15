package com.acme.salary.seed;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.LocalDate;

/**
 * @param enabled       seed on startup; off by default so production data is never touched by accident
 * @param employeeCount how many employees to generate
 * @param randomSeed    fixed seed, so every environment gets the same people
 * @param asOf          the "today" the data is generated relative to
 */
@ConfigurationProperties(prefix = "app.seed")
public record SeedProperties(boolean enabled, int employeeCount, long randomSeed, LocalDate asOf) {
}
