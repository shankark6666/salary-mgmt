package com.acme.salary.security;

import com.acme.salary.TestcontainersConfiguration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Who may do what, and how the API behaves for everyone else. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SecurityIntegrationTest {

    private static final String MANAGER = "test.manager";
    private static final String MANAGER_PASSWORD = "test-manager-password-123";
    private static final String NEW_EMPLOYEE = """
            {"fullName":"Jane Doe","email":"jane.sec@acme.com","countryCode":"US","departmentId":1,
             "jobTitleId":4,"employmentType":"FULL_TIME","hireDate":"2024-03-01","salary":100000}""";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM app_users WHERE username = 'lockout.target'");
        jdbc.update("UPDATE app_users SET failed_attempts = 0, locked_until = NULL");
    }

    @Test
    void anonymousRequestsGet401InTheStandardEnvelope() throws Exception {
        mvc.perform(get("/api/v1/employees"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("UNAUTHENTICATED"));
        mvc.perform(get("/api/v1/insights/overview")).andExpect(status().isUnauthorized());
    }

    @Test
    void healthCheckIsPublicButRevealsNothing() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components").doesNotExist());
    }

    @Test
    void otherActuatorEndpointsAndUnknownPathsAreDenied() throws Exception {
        mvc.perform(get("/actuator/env").with(user(MANAGER).roles("HR_MANAGER")))
                .andExpect(status().is4xxClientError());
        mvc.perform(get("/internal/anything").with(user(MANAGER).roles("HR_MANAGER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void signInWithCorrectPasswordStartsASession() throws Exception {
        MockHttpSession session = signIn(MANAGER, MANAGER_PASSWORD);

        mvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(MANAGER))
                .andExpect(jsonPath("$.data.role").value("HR_MANAGER"));
        mvc.perform(get("/api/v1/employees").session(session)).andExpect(status().isOk());
    }

    @Test
    void wrongPasswordAndUnknownUserAreIndistinguishable() throws Exception {
        String wrongPassword = login(MANAGER, "not-the-password").andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String unknownUser = login("no.such.user", "whatever").andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        org.assertj.core.api.Assertions.assertThat(stripTimestamp(wrongPassword))
                .isEqualTo(stripTimestamp(unknownUser));
    }

    @Test
    void signInRequiresCsrfToken() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(credentials(MANAGER, MANAGER_PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("CSRF_INVALID"));
    }

    @Test
    void writesWithoutCsrfTokenAreRejectedEvenWhenSignedIn() throws Exception {
        mvc.perform(post("/api/v1/employees").with(user(MANAGER).roles("HR_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content(NEW_EMPLOYEE))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("CSRF_INVALID"));
    }

    @Test
    void analystCanReadButNotChangeAnything() throws Exception {
        mvc.perform(get("/api/v1/employees").with(user("ana").roles("HR_ANALYST")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/insights/overview").with(user("ana").roles("HR_ANALYST")))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/employees").with(user("ana").roles("HR_ANALYST")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(NEW_EMPLOYEE))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
        mvc.perform(post("/api/v1/employees/1/deactivate").with(user("ana").roles("HR_ANALYST"))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void fiveWrongPasswordsLockTheAccountEvenForTheRightPassword() throws Exception {
        jdbc.update("""
                INSERT INTO app_users (username, display_name, password_hash, role)
                VALUES ('lockout.target', 'Target', ?, 'HR_ANALYST')""",
                passwordEncoder.encode("the-right-password-123"));

        for (int i = 0; i < 5; i++) {
            login("lockout.target", "guess-" + i).andExpect(status().isUnauthorized());
        }

        login("lockout.target", "the-right-password-123")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void signOutEndsTheSession() throws Exception {
        MockHttpSession session = signIn(MANAGER, MANAGER_PASSWORD);

        mvc.perform(post("/api/v1/auth/logout").session(session).with(csrf()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/auth/me").session(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void responsesCarryProtectiveHeaders() throws Exception {
        mvc.perform(get("/api/v1/employees").secure(true).with(user(MANAGER).roles("HR_MANAGER")))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Content-Security-Policy", containsString("default-src 'none'")))
                .andExpect(header().string("Content-Security-Policy", containsString("frame-ancestors 'none'")))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("Strict-Transport-Security", containsString("max-age=31536000")))
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(header().exists("Permissions-Policy"));
    }

    @Test
    void crossOriginRequestsGetNoCorsGrant() throws Exception {
        mvc.perform(get("/api/v1/employees").with(user(MANAGER).roles("HR_MANAGER"))
                        .header("Origin", "https://evil.example"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    private MockHttpSession signIn(String username, String password) throws Exception {
        return (MockHttpSession) login(username, password)
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession(false);
    }

    private ResultActions login(String username, String password) throws Exception {
        return mvc.perform(post("/api/v1/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(credentials(username, password)));
    }

    private static String credentials(String username, String password) {
        return "{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, password);
    }

    private static String stripTimestamp(String json) {
        return json.replaceAll("\"timestamp\":\"[^\"]+\"", "");
    }
}
