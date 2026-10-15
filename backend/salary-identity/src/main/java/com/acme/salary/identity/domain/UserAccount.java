package com.acme.salary.identity.domain;

import java.time.Duration;
import java.time.Instant;

/**
 * A person who can sign in, with brute-force protection: after {@link #MAX_FAILED_ATTEMPTS}
 * consecutive failures the account locks for {@link #LOCKOUT}.
 *
 * <p>Trade-off: an attacker who knows a username can keep that person locked out. A short,
 * self-expiring lock limits that to an inconvenience while making password guessing
 * impractical (5 guesses per 15 minutes).
 */
public class UserAccount {

    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final Duration LOCKOUT = Duration.ofMinutes(15);

    private final Long id;
    private final String username;
    private final String displayName;
    private final String passwordHash;
    private final Role role;
    private final boolean enabled;
    private int failedAttempts;
    private Instant lockedUntil;
    private Instant lastLoginAt;

    public UserAccount(Long id, String username, String displayName, String passwordHash, Role role,
                       boolean enabled, int failedAttempts, Instant lockedUntil, Instant lastLoginAt) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
        this.role = role;
        this.enabled = enabled;
        this.failedAttempts = failedAttempts;
        this.lockedUntil = lockedUntil;
        this.lastLoginAt = lastLoginAt;
    }

    public boolean isLocked(Instant now) {
        return lockedUntil != null && now.isBefore(lockedUntil);
    }

    public boolean canSignIn(Instant now) {
        return enabled && !isLocked(now);
    }

    public void recordFailedLogin(Instant now) {
        if (lockedUntil != null && !now.isBefore(lockedUntil)) {
            failedAttempts = 0;
            lockedUntil = null;
        }
        failedAttempts++;
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            lockedUntil = now.plus(LOCKOUT);
        }
    }

    public void recordSuccessfulLogin(Instant now) {
        failedAttempts = 0;
        lockedUntil = null;
        lastLoginAt = now;
    }

    public Long id() {
        return id;
    }

    public String username() {
        return username;
    }

    public String displayName() {
        return displayName;
    }

    public String passwordHash() {
        return passwordHash;
    }

    public Role role() {
        return role;
    }

    public boolean enabled() {
        return enabled;
    }

    public int failedAttempts() {
        return failedAttempts;
    }

    public Instant lockedUntil() {
        return lockedUntil;
    }

    public Instant lastLoginAt() {
        return lastLoginAt;
    }
}
