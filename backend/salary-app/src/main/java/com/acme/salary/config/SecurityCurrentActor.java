package com.acme.salary.config;

import com.acme.salary.employee.application.port.out.CurrentActor;
import com.acme.salary.identity.application.service.AuthenticatedUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Connects the employee module's audit port to the signed-in user, keeping modules decoupled. */
@Component
class SecurityCurrentActor implements CurrentActor {

    @Override
    public String username() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "system";
        }
        return authentication.getPrincipal() instanceof AuthenticatedUser user
                ? user.username()
                : authentication.getName();
    }
}
