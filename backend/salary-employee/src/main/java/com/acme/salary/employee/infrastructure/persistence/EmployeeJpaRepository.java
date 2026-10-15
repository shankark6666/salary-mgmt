package com.acme.salary.employee.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface EmployeeJpaRepository extends JpaRepository<EmployeeEntity, Long> {

    @Query("""
            SELECT count(e) > 0 FROM EmployeeEntity e
            WHERE lower(e.email) = lower(:email) AND (:excludingId IS NULL OR e.id <> :excludingId)""")
    boolean isEmailTaken(@Param("email") String email, @Param("excludingId") Long excludingId);

    @Query(value = "SELECT nextval('employee_code_seq')", nativeQuery = true)
    long nextCodeNumber();
}
