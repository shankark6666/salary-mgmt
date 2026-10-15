package com.acme.salary.common.web;

import com.acme.salary.common.api.ApiResponse;
import com.acme.salary.common.api.ErrorCodes;
import com.acme.salary.common.exception.SalaryAppException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Maps every failure to the {@link ApiResponse} envelope. Client mistakes are 4xx and logged
 * quietly; only genuinely unexpected errors are 500 and logged with a stack trace.
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.acme.salary")
public class GlobalExceptionHandler {

    @ExceptionHandler(SalaryAppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(SalaryAppException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.error(ex.getErrorCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleInvalidBody(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return ApiResponse.validationError(fieldErrors);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleInvalidParameters(HandlerMethodValidationException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getAllValidationResults().forEach(result -> fieldErrors.putIfAbsent(
                result.getMethodParameter().getParameterName(),
                result.getResolvableErrors().get(0).getDefaultMessage()));
        return ApiResponse.validationError(fieldErrors);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String type = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "value";
        return ApiResponse.error(ErrorCodes.VALIDATION_FAILED,
                "'%s' is not a valid %s".formatted(ex.getName(), type));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleMissingParameter(MissingServletRequestParameterException ex) {
        return ApiResponse.error(ErrorCodes.VALIDATION_FAILED,
                "Missing required parameter '%s'".formatted(ex.getParameterName()));
    }

    /** The parser's message quotes raw input and internal types, so it is logged, not returned. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleUnreadableBody(HttpMessageNotReadableException ex) {
        log.debug("Rejected unreadable request body: {}", ex.getMessage());
        return ApiResponse.error(ErrorCodes.MALFORMED_REQUEST,
                "Request body could not be read. Check that it is valid JSON.");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return ApiResponse.error(ErrorCodes.INTERNAL_ERROR, "An unexpected error occurred");
    }
}
