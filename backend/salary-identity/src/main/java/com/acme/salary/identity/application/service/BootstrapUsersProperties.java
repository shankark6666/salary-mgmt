package com.acme.salary.identity.application.service;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Accounts created on first start, when no user exists. Supplied through the environment so no
 * password is ever committed or defaulted. The analyst account is optional.
 */
@ConfigurationProperties(prefix = "app.security.bootstrap")
public record BootstrapUsersProperties(
        String managerUsername,
        String managerPassword,
        String analystUsername,
        String analystPassword) {
}
