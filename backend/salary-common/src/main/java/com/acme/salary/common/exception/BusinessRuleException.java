package com.acme.salary.common.exception;

import com.acme.salary.common.api.ErrorCodes;
import org.springframework.http.HttpStatus;

/** Well-formed request that breaks a domain rule, e.g. a salary change on an inactive employee. */
public class BusinessRuleException extends SalaryAppException {

    public BusinessRuleException(String message) {
        super(ErrorCodes.BUSINESS_RULE_VIOLATION, message);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.UNPROCESSABLE_ENTITY;
    }
}
