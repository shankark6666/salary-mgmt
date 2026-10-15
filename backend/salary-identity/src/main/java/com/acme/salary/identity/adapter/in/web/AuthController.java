package com.acme.salary.identity.adapter.in.web;

import com.acme.salary.common.api.ApiResponse;
import com.acme.salary.common.api.ErrorCodes;
import com.acme.salary.identity.application.service.AuthenticatedUser;
import com.acme.salary.identity.infrastructure.security.AccountAuthenticationProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    public record LoginRequest(@NotBlank @Size(max = 100) String username,
                               @NotBlank @Size(max = 200) String password) {

        /** Never print the password, even by accident in a log line. */
        @Override
        public String toString() {
            return "LoginRequest[username=" + username + "]";
        }
    }

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          SecurityContextRepository securityContextRepository) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    /** Sets the XSRF-TOKEN cookie the UI must echo back on sign-in and every write. */
    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf() {
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthenticatedUser>> login(
            @Valid @RequestBody LoginRequest login, HttpServletRequest request,
            HttpServletResponse response) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(login.username(), login.password()));
        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(
                    ErrorCodes.INVALID_CREDENTIALS, AccountAuthenticationProvider.GENERIC_FAILURE));
        }

        // New session id on sign-in: a session id planted before login is worthless after it.
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        return ResponseEntity.ok(ApiResponse.ok((AuthenticatedUser) authentication.getPrincipal()));
    }

    @GetMapping("/me")
    public ApiResponse<AuthenticatedUser> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.ok(user);
    }
}
