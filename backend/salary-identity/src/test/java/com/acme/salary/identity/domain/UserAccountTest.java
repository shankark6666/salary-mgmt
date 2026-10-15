package com.acme.salary.identity.domain;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class UserAccountTest {

    private static final Instant NOW = Instant.parse("2026-10-15T10:00:00Z");

    @Test
    void newAccountIsNotLocked() {
        assertThat(account().isLocked(NOW)).isFalse();
    }

    @Test
    void locksAfterMaxFailedAttempts() {
        UserAccount account = account();

        for (int i = 0; i < UserAccount.MAX_FAILED_ATTEMPTS - 1; i++) {
            account.recordFailedLogin(NOW);
        }
        assertThat(account.isLocked(NOW)).isFalse();

        account.recordFailedLogin(NOW);
        assertThat(account.isLocked(NOW)).isTrue();
        assertThat(account.lockedUntil()).isEqualTo(NOW.plus(UserAccount.LOCKOUT));
    }

    @Test
    void lockExpiresAfterLockoutPeriod() {
        UserAccount account = lockedAt(NOW);

        assertThat(account.isLocked(NOW.plus(UserAccount.LOCKOUT).minusSeconds(1))).isTrue();
        assertThat(account.isLocked(NOW.plus(UserAccount.LOCKOUT))).isFalse();
    }

    @Test
    void failuresAfterLockExpiryStartCountingAgain() {
        UserAccount account = lockedAt(NOW);
        Instant later = NOW.plus(UserAccount.LOCKOUT).plus(Duration.ofMinutes(1));

        account.recordFailedLogin(later);

        assertThat(account.isLocked(later)).isFalse();
        assertThat(account.failedAttempts()).isEqualTo(1);
    }

    @Test
    void successfulLoginClearsFailuresAndRecordsTime() {
        UserAccount account = account();
        account.recordFailedLogin(NOW);
        account.recordFailedLogin(NOW);

        account.recordSuccessfulLogin(NOW);

        assertThat(account.failedAttempts()).isZero();
        assertThat(account.lockedUntil()).isNull();
        assertThat(account.lastLoginAt()).isEqualTo(NOW);
    }

    @Test
    void disabledAccountCannotSignIn() {
        UserAccount account = new UserAccount(1L, "ana", "Ana", "{bcrypt}x", Role.HR_ANALYST,
                false, 0, null, null);

        assertThat(account.canSignIn(NOW)).isFalse();
    }

    @Test
    void onlyManagersMayChangeData() {
        assertThat(Role.HR_MANAGER.canWrite()).isTrue();
        assertThat(Role.HR_ANALYST.canWrite()).isFalse();
    }

    private static UserAccount account() {
        return new UserAccount(1L, "hr.manager", "HR Manager", "{bcrypt}x", Role.HR_MANAGER,
                true, 0, null, null);
    }

    private static UserAccount lockedAt(Instant when) {
        UserAccount account = account();
        for (int i = 0; i < UserAccount.MAX_FAILED_ATTEMPTS; i++) {
            account.recordFailedLogin(when);
        }
        return account;
    }
}
