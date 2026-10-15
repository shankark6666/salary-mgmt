package com.acme.salary.common.web;

import com.acme.salary.common.exception.BusinessRuleException;
import com.acme.salary.common.exception.ConflictException;
import com.acme.salary.common.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new FailingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void notFoundMapsTo404WithErrorCode() throws Exception {
        mvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Employee not found: 42"));
    }

    @Test
    void conflictMapsTo409() throws Exception {
        mvc.perform(get("/test/conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("CONFLICT"));
    }

    @Test
    void businessRuleMapsTo422() throws Exception {
        mvc.perform(get("/test/business-rule"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("BUSINESS_RULE_VIOLATION"));
    }

    @Test
    void invalidBodyReportsEachRejectedField() throws Exception {
        mvc.perform(post("/test/body")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"salary\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.salary").exists());
    }

    @Test
    void malformedJsonIs400WithoutLeakingParserDetails() throws Exception {
        mvc.perform(post("/test/body")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.message")
                        .value("Request body could not be read. Check that it is valid JSON."));
    }

    @Test
    void wrongPathVariableTypeIs400NotServerError() throws Exception {
        mvc.perform(get("/test/typed/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    void unexpectedExceptionIs500WithGenericMessage() throws Exception {
        mvc.perform(get("/test/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.errorCode").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"));
    }

    record TestBody(@NotBlank String name, @Positive BigDecimal salary) {
    }

    @RestController
    static class FailingController {

        @GetMapping("/test/not-found")
        void notFound() {
            throw new ResourceNotFoundException("Employee", 42);
        }

        @GetMapping("/test/conflict")
        void conflict() {
            throw new ConflictException("Email already in use");
        }

        @GetMapping("/test/business-rule")
        void businessRule() {
            throw new BusinessRuleException("Employee is inactive");
        }

        @PostMapping("/test/body")
        void body(@Valid @RequestBody TestBody body) {
        }

        @GetMapping("/test/typed/{id}")
        void typed(@PathVariable Long id) {
        }

        @GetMapping("/test/boom")
        void boom() {
            throw new IllegalStateException("internal detail that must not leak");
        }
    }
}
