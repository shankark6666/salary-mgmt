package com.acme.salary.common.exception;

import com.acme.salary.common.api.ErrorCodes;
import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends SalaryAppException {

    public ResourceNotFoundException(String resource, Object id) {
        super(ErrorCodes.RESOURCE_NOT_FOUND, "%s not found: %s".formatted(resource, id));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
