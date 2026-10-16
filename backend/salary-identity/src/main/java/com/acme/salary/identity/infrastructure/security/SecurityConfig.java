package com.acme.salary.identity.infrastructure.security;

import com.acme.salary.identity.application.port.out.UserAccountRepository;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.header.writers.ContentSecurityPolicyHeaderWriter;
import org.springframework.security.web.header.writers.DelegatingRequestMatcherHeaderWriter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.NegatedRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.time.Clock;

/**
 * The HTTP security policy. Deny by default; every allowed path is listed here.
 *
 * <ul>
 *   <li>Session cookie (HttpOnly, Secure, SameSite=Strict — see application.yml). No tokens in
 *       JavaScript-readable storage.</li>
 *   <li>CSRF on every state-changing request, including sign-in and sign-out.</li>
 *   <li>Reads need HR_ANALYST or HR_MANAGER; writes need HR_MANAGER.</li>
 *   <li>No CORS: the UI is served from the same origin via a proxy, so cross-origin calls are
 *       refused by the browser.</li>
 * </ul>
 */
@Configuration(proxyBeanMethods = false)
public class SecurityConfig {

    private static final String MANAGER = "HR_MANAGER";
    private static final String ANALYST = "HR_ANALYST";

    /** JSON-only API: nothing may be loaded, framed or submitted from its responses. */
    private static final String API_CSP =
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

    private static final RequestMatcher API_DOCS = new OrRequestMatcher(
            PathPatternRequestMatcher.withDefaults().matcher("/swagger-ui/**"),
            PathPatternRequestMatcher.withDefaults().matcher("/swagger-ui.html"),
            PathPatternRequestMatcher.withDefaults().matcher("/v3/api-docs/**"));

    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http, ObjectMapper objectMapper,
                                    @Value("${app.security.cookie-secure:true}") boolean secureCookies)
            throws Exception {
        JsonSecurityErrorHandlers errors = new JsonSecurityErrorHandlers(objectMapper);
        CookieCsrfTokenRepository csrfTokens = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokens.setCookieCustomizer(cookie -> cookie.sameSite("Strict").secure(secureCookies));

        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/csrf").permitAll()
                        .requestMatchers(API_DOCS).hasRole(MANAGER)
                        // Bulk export is how the whole dataset leaves the system: managers only,
                        // even though analysts may read the same rows on screen.
                        .requestMatchers(HttpMethod.GET, "/api/v1/employees/export").hasRole(MANAGER)
                        .requestMatchers(HttpMethod.GET, "/api/**").hasAnyRole(MANAGER, ANALYST)
                        .requestMatchers("/api/**").hasRole(MANAGER)
                        .anyRequest().denyAll())
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokens)
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
                .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
                .securityContext(context -> context.securityContextRepository(securityContextRepository()))
                .sessionManagement(session -> session.sessionFixation(fixation -> fixation.changeSessionId()))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(errors.unauthenticated())
                        .accessDeniedHandler(errors.accessDenied()))
                .logout(logout -> logout
                        .logoutUrl("/api/v1/auth/logout")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT))
                        .invalidateHttpSession(true)
                        .deleteCookies("SALARY_SESSION"))
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer.policy(
                                ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true).maxAgeInSeconds(31_536_000))
                        // Swagger UI (off in production) needs scripts; everything else gets none.
                        .addHeaderWriter(new DelegatingRequestMatcherHeaderWriter(
                                new NegatedRequestMatcher(API_DOCS),
                                new ContentSecurityPolicyHeaderWriter(API_CSP)))
                        .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy",
                                "camera=(), microphone=(), geolocation=(), payment=()")))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .requestCache(cache -> cache.disable())
                .cors(AbstractHttpConfigurer::disable);
        return http.build();
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        // bcrypt today; the "{id}" prefix lets hashes migrate to a stronger algorithm later.
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    AccountAuthenticationProvider accountAuthenticationProvider(UserAccountRepository accounts,
                                                                PasswordEncoder passwordEncoder,
                                                                Clock clock) {
        return new AccountAuthenticationProvider(accounts, passwordEncoder, clock);
    }

    @Bean
    AuthenticationManager authenticationManager(AccountAuthenticationProvider provider) {
        return new ProviderManager(provider);
    }
}
