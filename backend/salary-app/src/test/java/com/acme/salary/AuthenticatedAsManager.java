package com.acme.salary;

import org.springframework.boot.webmvc.test.autoconfigure.MockMvcBuilderCustomizer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * For feature tests that are not about security: every MockMvc request runs as an HR manager
 * with a valid CSRF token. Security behaviour itself is covered by SecurityIntegrationTest.
 */
@TestConfiguration(proxyBeanMethods = false)
public class AuthenticatedAsManager {

    public static final String USERNAME = "test.manager";

    @Bean
    MockMvcBuilderCustomizer authenticatedManager() {
        return builder -> builder.defaultRequest(get("/")
                .with(user(USERNAME).roles("HR_MANAGER"))
                .with(csrf()));
    }
}
