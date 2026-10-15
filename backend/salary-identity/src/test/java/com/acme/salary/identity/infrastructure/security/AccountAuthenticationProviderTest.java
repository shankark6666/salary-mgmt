package com.acme.salary.identity.infrastructure.security;

import com.acme.salary.identity.application.port.out.UserAccountRepository;
import com.acme.salary.identity.application.service.AuthenticatedUser;
import com.acme.salary.identity.domain.Role;
import com.acme.salary.identity.domain.UserAccount;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccountAuthenticationProviderTest {

    private static final Instant NOW = Instant.parse("2026-10-15T10:00:00Z");

    private final UserAccountRepository accounts = mock(UserAccountRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private AccountAuthenticationProvider provider;
    private UserAccount manager;

    @BeforeEach
    void setUp() {
        when(encoder.encode(anyString())).thenReturn("{bcrypt}dummy");
        when(encoder.matches("correct-password", "{bcrypt}real")).thenReturn(true);
        provider = new AccountAuthenticationProvider(accounts, encoder,
                Clock.fixed(NOW, ZoneOffset.UTC));
        manager = new UserAccount(1L, "hr.manager", "Hana Manager", "{bcrypt}real",
                Role.HR_MANAGER, true, 0, null, null);
        when(accounts.findByUsername("hr.manager")).thenReturn(Optional.of(manager));
    }

    @Test
    void correctPasswordAuthenticatesWithRoleAuthority() {
        Authentication result = provider.authenticate(login("hr.manager", "correct-password"));

        assertThat(result.isAuthenticated()).isTrue();
        assertThat(result.getPrincipal())
                .isEqualTo(new AuthenticatedUser("hr.manager", "Hana Manager", Role.HR_MANAGER));
        assertThat(result.getAuthorities()).extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_HR_MANAGER");
        assertThat(result.getCredentials()).as("password must not linger in the session").isNull();
        verify(accounts).saveLoginState(manager);
        assertThat(manager.lastLoginAt()).isEqualTo(NOW);
    }

    @Test
    void wrongPasswordIsCountedAndPersisted() {
        assertThatThrownBy(() -> provider.authenticate(login("hr.manager", "wrong")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage(AccountAuthenticationProvider.GENERIC_FAILURE);

        assertThat(manager.failedAttempts()).isEqualTo(1);
        verify(accounts).saveLoginState(manager);
    }

    @Test
    void unknownUserGetsTheSameMessageAndStillPaysForAHash() {
        when(accounts.findByUsername("nobody")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> provider.authenticate(login("nobody", "whatever")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage(AccountAuthenticationProvider.GENERIC_FAILURE);

        verify(encoder).matches("whatever", "{bcrypt}dummy");
    }

    @Test
    void lockedAccountRejectsEvenTheCorrectPasswordWithoutExtendingTheLock() {
        for (int i = 0; i < UserAccount.MAX_FAILED_ATTEMPTS; i++) {
            manager.recordFailedLogin(NOW.minusSeconds(60));
        }
        Instant lockedUntil = manager.lockedUntil();

        assertThatThrownBy(() -> provider.authenticate(login("hr.manager", "correct-password")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage(AccountAuthenticationProvider.GENERIC_FAILURE);

        assertThat(manager.lockedUntil()).isEqualTo(lockedUntil);
        verify(accounts, never()).saveLoginState(any());
        verify(encoder, never()).matches(eq("correct-password"), eq("{bcrypt}real"));
    }

    @Test
    void fifthWrongPasswordLocksTheAccount() {
        for (int i = 0; i < UserAccount.MAX_FAILED_ATTEMPTS; i++) {
            assertThatThrownBy(() -> provider.authenticate(login("hr.manager", "wrong")))
                    .isInstanceOf(BadCredentialsException.class);
        }

        assertThat(manager.isLocked(NOW)).isTrue();
    }

    @Test
    void usernameIsTrimmed() {
        provider.authenticate(login("  hr.manager ", "correct-password"));

        verify(accounts).findByUsername("hr.manager");
    }

    private static UsernamePasswordAuthenticationToken login(String username, String password) {
        return UsernamePasswordAuthenticationToken.unauthenticated(username, password);
    }
}
