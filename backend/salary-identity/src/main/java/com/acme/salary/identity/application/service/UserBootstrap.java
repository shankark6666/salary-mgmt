package com.acme.salary.identity.application.service;

import com.acme.salary.identity.application.port.out.UserAccountRepository;
import com.acme.salary.identity.domain.Role;
import com.acme.salary.identity.domain.UserAccount;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first accounts on an empty database. Refuses to start with no way to sign in, or
 * with a weak password: a misconfigured deployment fails loudly instead of running wide open.
 */
@Slf4j
@Component
@Order(0)
@EnableConfigurationProperties(BootstrapUsersProperties.class)
public class UserBootstrap implements ApplicationRunner {

    static final int MIN_PASSWORD_LENGTH = 12;

    private final UserAccountRepository accounts;
    private final PasswordEncoder passwordEncoder;
    private final BootstrapUsersProperties properties;

    public UserBootstrap(UserAccountRepository accounts, PasswordEncoder passwordEncoder,
                         BootstrapUsersProperties properties) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (accounts.existsAny()) {
            return;
        }
        if (isBlank(properties.managerUsername()) || isBlank(properties.managerPassword())) {
            throw new IllegalStateException("No user accounts exist. Set BOOTSTRAP_MANAGER_USERNAME "
                    + "and BOOTSTRAP_MANAGER_PASSWORD to create the first HR manager.");
        }
        create(properties.managerUsername(), properties.managerPassword(), "HR Manager",
                Role.HR_MANAGER);
        if (!isBlank(properties.analystUsername()) && !isBlank(properties.analystPassword())) {
            create(properties.analystUsername(), properties.analystPassword(), "HR Analyst",
                    Role.HR_ANALYST);
        }
    }

    private void create(String username, String password, String displayName, Role role) {
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException("Bootstrap password for %s must be at least %d characters"
                    .formatted(username, MIN_PASSWORD_LENGTH));
        }
        accounts.create(new UserAccount(null, username.strip(), displayName,
                passwordEncoder.encode(password), role, true, 0, null, null));
        log.info("Created initial {} account '{}'", role, username.strip());
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
