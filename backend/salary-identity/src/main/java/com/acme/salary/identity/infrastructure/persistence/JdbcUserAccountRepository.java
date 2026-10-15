package com.acme.salary.identity.infrastructure.persistence;

import com.acme.salary.identity.application.port.out.UserAccountRepository;
import com.acme.salary.identity.domain.Role;
import com.acme.salary.identity.domain.UserAccount;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Repository
class JdbcUserAccountRepository implements UserAccountRepository {

    private final NamedParameterJdbcTemplate jdbc;

    JdbcUserAccountRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<UserAccount> findByUsername(String username) {
        return jdbc.query("""
                SELECT id, username, display_name, password_hash, role, enabled, failed_attempts,
                       locked_until, last_login_at
                FROM app_users WHERE lower(username) = lower(:username)""",
                Map.of("username", username),
                (rs, i) -> new UserAccount(
                        rs.getLong("id"),
                        rs.getString("username"),
                        rs.getString("display_name"),
                        rs.getString("password_hash"),
                        Role.valueOf(rs.getString("role")),
                        rs.getBoolean("enabled"),
                        rs.getInt("failed_attempts"),
                        instant(rs.getTimestamp("locked_until")),
                        instant(rs.getTimestamp("last_login_at"))))
                .stream().findFirst();
    }

    @Override
    public void create(UserAccount account) {
        jdbc.update("""
                INSERT INTO app_users (username, display_name, password_hash, role, enabled)
                VALUES (:username, :displayName, :passwordHash, :role, :enabled)""",
                new MapSqlParameterSource()
                        .addValue("username", account.username())
                        .addValue("displayName", account.displayName())
                        .addValue("passwordHash", account.passwordHash())
                        .addValue("role", account.role().name())
                        .addValue("enabled", account.enabled()));
    }

    @Override
    public void saveLoginState(UserAccount account) {
        jdbc.update("""
                UPDATE app_users
                SET failed_attempts = :failedAttempts, locked_until = :lockedUntil,
                    last_login_at = :lastLoginAt
                WHERE id = :id""",
                new MapSqlParameterSource()
                        .addValue("id", account.id())
                        .addValue("failedAttempts", account.failedAttempts())
                        .addValue("lockedUntil", timestamp(account.lockedUntil()))
                        .addValue("lastLoginAt", timestamp(account.lastLoginAt())));
    }

    @Override
    public boolean existsAny() {
        return Boolean.TRUE.equals(jdbc.getJdbcTemplate()
                .queryForObject("SELECT EXISTS (SELECT 1 FROM app_users)", Boolean.class));
    }

    private static Instant instant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private static Timestamp timestamp(Instant instant) {
        return instant == null ? null : Timestamp.from(instant);
    }
}
