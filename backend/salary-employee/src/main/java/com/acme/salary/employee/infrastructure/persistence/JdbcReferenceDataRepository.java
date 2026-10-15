package com.acme.salary.employee.infrastructure.persistence;

import com.acme.salary.employee.application.model.ReferenceData;
import com.acme.salary.employee.application.port.out.ReferenceDataRepository;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Map;

@Repository
class JdbcReferenceDataRepository implements ReferenceDataRepository {

    private final NamedParameterJdbcTemplate jdbc;

    JdbcReferenceDataRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public ReferenceData load() {
        var countries = jdbc.query("""
                SELECT c.code, c.name, c.currency_code, r.usd_rate
                FROM countries c JOIN fx_rates r ON r.currency_code = c.currency_code
                ORDER BY c.name""",
                (rs, i) -> new ReferenceData.Country(rs.getString("code"), rs.getString("name"),
                        rs.getString("currency_code"), rs.getBigDecimal("usd_rate")));
        var departments = jdbc.query("SELECT id, name FROM departments ORDER BY name",
                (rs, i) -> new ReferenceData.Department(rs.getInt("id"), rs.getString("name")));
        var jobTitles = jdbc.query("SELECT id, name, level FROM job_titles ORDER BY level, name",
                (rs, i) -> new ReferenceData.JobTitle(rs.getInt("id"), rs.getString("name"),
                        rs.getInt("level")));
        LocalDate asOf = jdbc.getJdbcTemplate()
                .queryForObject("SELECT max(as_of) FROM fx_rates", LocalDate.class);
        return new ReferenceData(countries, departments, jobTitles, asOf);
    }

    @Override
    public boolean countryExists(String code) {
        return exists("SELECT EXISTS (SELECT 1 FROM countries WHERE code = :v)", code);
    }

    @Override
    public boolean departmentExists(int id) {
        return exists("SELECT EXISTS (SELECT 1 FROM departments WHERE id = :v)", id);
    }

    @Override
    public boolean jobTitleExists(int id) {
        return exists("SELECT EXISTS (SELECT 1 FROM job_titles WHERE id = :v)", id);
    }

    private boolean exists(String sql, Object value) {
        return Boolean.TRUE.equals(jdbc.queryForObject(sql, Map.of("v", value), Boolean.class));
    }
}
