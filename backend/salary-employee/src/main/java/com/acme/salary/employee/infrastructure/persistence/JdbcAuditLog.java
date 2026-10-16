package com.acme.salary.employee.infrastructure.persistence;

import com.acme.salary.employee.application.port.out.AuditLog;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class JdbcAuditLog implements AuditLog {

    private static final int MAX_DETAILS = 1000;

    private final NamedParameterJdbcTemplate jdbc;

    JdbcAuditLog(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void record(String actor, String action, String details) {
        jdbc.update("INSERT INTO audit_events (actor, action, details) VALUES (:actor, :action, :details)",
                new MapSqlParameterSource()
                        .addValue("actor", actor)
                        .addValue("action", action)
                        .addValue("details", details.length() > MAX_DETAILS ? details.substring(0, MAX_DETAILS) : details));
    }
}
