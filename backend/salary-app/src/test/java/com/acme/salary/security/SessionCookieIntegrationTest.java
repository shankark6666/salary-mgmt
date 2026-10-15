package com.acme.salary.security;

import com.acme.salary.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Real HTTP against an embedded Tomcat, because cookie attributes (HttpOnly, Secure, SameSite)
 * are applied by the servlet container and MockMvc never sees them. Walks the browser flow:
 * fetch CSRF token, sign in, read, write.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class SessionCookieIntegrationTest {

    @LocalServerPort
    private int port;

    private final HttpClient http = HttpClient.newHttpClient();

    @Test
    void browserSignInFlowUsesHardenedCookies() throws Exception {
        HttpResponse<String> csrf = send(HttpRequest.newBuilder(uri("/api/v1/auth/csrf")).GET());
        String xsrfCookie = setCookie(csrf, "XSRF-TOKEN").orElseThrow();
        String xsrfToken = cookieValue(xsrfCookie);
        assertThat(xsrfCookie).contains("SameSite=Strict").contains("Secure")
                .as("the UI must be able to read it").doesNotContain("HttpOnly");

        HttpResponse<String> login = send(HttpRequest.newBuilder(uri("/api/v1/auth/login"))
                .header("Content-Type", "application/json")
                .header("X-XSRF-TOKEN", xsrfToken)
                .header("Cookie", "XSRF-TOKEN=" + xsrfToken)
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"username\":\"test.manager\",\"password\":\"test-manager-password-123\"}")));
        assertThat(login.statusCode()).isEqualTo(200);

        String sessionCookie = setCookie(login, "SALARY_SESSION").orElseThrow();
        assertThat(sessionCookie).contains("HttpOnly").contains("Secure").contains("SameSite=Strict");

        HttpResponse<String> me = send(HttpRequest.newBuilder(uri("/api/v1/auth/me"))
                .header("Cookie", "SALARY_SESSION=" + cookieValue(sessionCookie)).GET());
        assertThat(me.statusCode()).isEqualTo(200);
        assertThat(me.body()).contains("\"username\":\"test.manager\"").doesNotContain("password");
    }

    @Test
    void sessionIdIsReplacedAtSignInToPreventFixation() throws Exception {
        HttpResponse<String> csrf = send(HttpRequest.newBuilder(uri("/api/v1/auth/csrf")).GET());
        String xsrfToken = cookieValue(setCookie(csrf, "XSRF-TOKEN").orElseThrow());
        String plantedSession = "SALARY_SESSION=attacker-chosen-id";

        HttpResponse<String> login = send(HttpRequest.newBuilder(uri("/api/v1/auth/login"))
                .header("Content-Type", "application/json")
                .header("X-XSRF-TOKEN", xsrfToken)
                .header("Cookie", "XSRF-TOKEN=" + xsrfToken + "; " + plantedSession)
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"username\":\"test.manager\",\"password\":\"test-manager-password-123\"}")));

        assertThat(login.statusCode()).isEqualTo(200);
        assertThat(cookieValue(setCookie(login, "SALARY_SESSION").orElseThrow()))
                .isNotEqualTo("attacker-chosen-id");
    }

    private HttpResponse<String> send(HttpRequest.Builder request) throws Exception {
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    private static Optional<String> setCookie(HttpResponse<?> response, String name) {
        List<String> cookies = response.headers().allValues("Set-Cookie");
        return cookies.stream().filter(c -> c.startsWith(name + "=")).findFirst();
    }

    private static String cookieValue(String setCookie) {
        return setCookie.substring(setCookie.indexOf('=') + 1, setCookie.indexOf(';'));
    }
}
