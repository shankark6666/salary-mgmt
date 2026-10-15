package com.acme.salary.identity.infrastructure.security;

import com.acme.salary.identity.application.port.out.UserAccountRepository;
import com.acme.salary.identity.application.service.AuthenticatedUser;
import com.acme.salary.identity.domain.UserAccount;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

/**
 * Username/password sign-in with lockout.
 *
 * <p>Every failure — unknown user, wrong password, locked or disabled account — produces the same
 * exception and message, and every path runs one password hash, so neither the response nor its
 * timing tells an attacker which usernames exist.
 */
@Slf4j
public class AccountAuthenticationProvider implements AuthenticationProvider {

    public static final String GENERIC_FAILURE = "Invalid username or password";

    private final UserAccountRepository accounts;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final String dummyHash;

    public AccountAuthenticationProvider(UserAccountRepository accounts,
                                         PasswordEncoder passwordEncoder, Clock clock) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
        this.dummyHash = passwordEncoder.encode("timing-equaliser-not-a-real-password");
    }

    @Override
    public Authentication authenticate(Authentication authentication) {
        String username = authentication.getName() == null ? "" : authentication.getName().strip();
        String password = authentication.getCredentials() == null
                ? "" : authentication.getCredentials().toString();
        Instant now = clock.instant();

        UserAccount account = accounts.findByUsername(username).orElse(null);
        if (account == null) {
            passwordEncoder.matches(password, dummyHash);
            log.info("Sign-in failed: unknown user");
            throw new BadCredentialsException(GENERIC_FAILURE);
        }
        if (!account.canSignIn(now)) {
            // Not counted as a failure: retrying while locked must not extend the lock forever.
            passwordEncoder.matches(password, dummyHash);
            log.warn("Sign-in refused for {}: account {}", account.username(),
                    account.enabled() ? "locked until " + account.lockedUntil() : "disabled");
            throw new BadCredentialsException(GENERIC_FAILURE);
        }
        if (!passwordEncoder.matches(password, account.passwordHash())) {
            account.recordFailedLogin(now);
            accounts.saveLoginState(account);
            log.warn("Sign-in failed for {} ({} consecutive){}", account.username(),
                    account.failedAttempts(), account.isLocked(now) ? " — account locked" : "");
            throw new BadCredentialsException(GENERIC_FAILURE);
        }

        account.recordSuccessfulLogin(now);
        accounts.saveLoginState(account);
        log.info("Signed in: {}", account.username());
        AuthenticatedUser principal =
                new AuthenticatedUser(account.username(), account.displayName(), account.role());
        return UsernamePasswordAuthenticationToken.authenticated(principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + account.role().name())));
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
