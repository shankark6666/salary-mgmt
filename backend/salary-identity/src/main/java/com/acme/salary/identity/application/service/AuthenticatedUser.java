package com.acme.salary.identity.application.service;

import com.acme.salary.identity.domain.Role;

import java.io.Serializable;

/** The signed-in person, as kept in the HTTP session. Holds no secrets. */
public record AuthenticatedUser(String username, String displayName, Role role)
        implements Serializable {
}
