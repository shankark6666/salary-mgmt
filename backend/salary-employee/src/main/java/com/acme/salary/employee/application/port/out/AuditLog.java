package com.acme.salary.employee.application.port.out;

/** Append-only record of security-relevant actions. */
public interface AuditLog {

    void record(String actor, String action, String details);
}
