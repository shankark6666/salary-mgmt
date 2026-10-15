package com.acme.salary.common.exception;

import com.acme.salary.common.api.ErrorCodes;
import org.springframework.http.HttpStatus;

/** The request is valid but clashes with current state, e.g. a duplicate email. */
public class ConflictException extends SalaryAppException {

    public ConflictException(String message) {
        super(ErrorCodes.CONFLICT, message);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.CONFLICT;
    }
}
