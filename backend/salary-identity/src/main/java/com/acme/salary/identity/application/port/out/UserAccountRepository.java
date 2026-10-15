package com.acme.salary.identity.application.port.out;

import com.acme.salary.identity.domain.UserAccount;

import java.util.Optional;

public interface UserAccountRepository {

    /** Case-insensitive. */
    Optional<UserAccount> findByUsername(String username);

    void create(UserAccount account);

    /** Persists failed-attempt count, lock and last-login time. */
    void saveLoginState(UserAccount account);

    boolean existsAny();
}
