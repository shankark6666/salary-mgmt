package com.acme.salary.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Base for expected, client-facing failures. Each subtype owns its HTTP status, so a new
 * exception type cannot silently fall back to the wrong one.
 */
public abstract class SalaryAppException extends RuntimeException {

    private final String errorCode;

    protected SalaryAppException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public abstract HttpStatus getStatus();
}
