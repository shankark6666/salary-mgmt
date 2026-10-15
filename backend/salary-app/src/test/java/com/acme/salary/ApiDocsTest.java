package com.acme.salary;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * API docs are off by default, so without this test a broken springdoc upgrade would pass CI
 * unnoticed. Enabled here, they must generate and stay restricted to managers.
 */
@SpringBootTest(properties = {"springdoc.api-docs.enabled=true", "springdoc.swagger-ui.enabled=true"})
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ApiDocsTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void openApiDocumentDescribesTheApi() throws Exception {
        mvc.perform(get("/v3/api-docs").with(user("m").roles("HR_MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").exists())
                .andExpect(jsonPath("$.paths['/api/v1/employees']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/insights/outliers']").exists());
    }

    @Test
    void docsAreNotVisibleToAnalystsOrAnonymousUsers() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isUnauthorized());
        mvc.perform(get("/v3/api-docs").with(user("a").roles("HR_ANALYST")))
                .andExpect(status().isForbidden());
    }
}
