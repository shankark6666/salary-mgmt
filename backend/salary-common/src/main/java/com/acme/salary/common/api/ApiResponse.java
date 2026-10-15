package com.acme.salary.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

/**
 * Envelope for every API response, success or failure, so the client handles one shape.
 *
 * {@code fieldErrors} is only present when a request fails validation, keeping "what you asked
 * for" ({@code data}) separate from "what was wrong with the request".
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        String errorCode,
        String message,
        Map<String, String> fieldErrors,
        Instant timestamp) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, null, Instant.now());
    }

    public static <T> ApiResponse<T> error(String errorCode, String message) {
        return new ApiResponse<>(false, null, errorCode, message, null, Instant.now());
    }

    public static <T> ApiResponse<T> validationError(Map<String, String> fieldErrors) {
        return new ApiResponse<>(false, null, ErrorCodes.VALIDATION_FAILED,
                "Request validation failed", fieldErrors, Instant.now());
    }
}
