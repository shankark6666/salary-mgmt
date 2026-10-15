package com.acme.salary.identity.infrastructure.security;

import com.acme.salary.common.api.ApiResponse;
import com.acme.salary.common.api.ErrorCodes;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.csrf.CsrfException;

import java.io.IOException;

/** 401/403 in the same {@link ApiResponse} envelope as every other error. */
final class JsonSecurityErrorHandlers {

    private final ObjectMapper objectMapper;

    JsonSecurityErrorHandlers(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    AuthenticationEntryPoint unauthenticated() {
        return (request, response, ex) -> write(response, HttpStatus.UNAUTHORIZED,
                ErrorCodes.UNAUTHENTICATED, "Sign in to continue");
    }

    AccessDeniedHandler accessDenied() {
        return (request, response, ex) -> {
            if (ex instanceof CsrfException) {
                write(response, HttpStatus.FORBIDDEN, ErrorCodes.CSRF_INVALID,
                        "Security token missing or expired. Reload the page and try again.");
            } else {
                write(response, HttpStatus.FORBIDDEN, ErrorCodes.FORBIDDEN,
                        "You do not have permission to do this");
            }
        };
    }

    private void write(HttpServletResponse response, HttpStatus status, String code, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), ApiResponse.error(code, message));
    }
}
