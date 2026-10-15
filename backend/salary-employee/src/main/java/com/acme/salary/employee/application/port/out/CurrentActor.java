package com.acme.salary.employee.application.port.out;

/** Who is making the current change, for the audit trail. */
public interface CurrentActor {

    String username();
}
