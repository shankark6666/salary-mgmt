package com.acme.salary.common.exception;

import com.acme.salary.common.api.ErrorCodes;
import org.springframework.http.HttpStatus;

/** Request is malformed in a way bean validation cannot express, e.g. an unknown sort field. */
public class BadRequestException extends SalaryAppException {

    public BadRequestException(String message) {
        super(ErrorCodes.VALIDATION_FAILED, message);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.BAD_REQUEST;
    }
}
