package com.acme.salary.insights.adapter.in.web;

import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.common.web.GlobalExceptionHandler;
import com.acme.salary.insights.application.model.OutlierCriteria;
import com.acme.salary.insights.application.port.in.InsightQueries;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InsightController.class)
@Import(GlobalExceptionHandler.class)
class InsightControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private InsightQueries queries;

    @Test
    void outliersUseDefaultThresholdAndPaging() throws Exception {
        when(queries.outliers(any())).thenReturn(new PagedResponse<>(List.of(), 0, 25, 0, 0));

        mvc.perform(get("/api/v1/insights/outliers")).andExpect(status().isOk());

        verify(queries).outliers(new OutlierCriteria(25, null, null, 0, 25));
    }

    @Test
    void outlierThresholdBelowFivePercentIsRejected() throws Exception {
        mvc.perform(get("/api/v1/insights/outliers").param("threshold", "1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.threshold").exists());
        verify(queries, never()).outliers(any());
    }

    @Test
    void lowercaseCountryCodeIsRejected() throws Exception {
        mvc.perform(get("/api/v1/insights/countries/in/roles"))
                .andExpect(status().isBadRequest());
        verify(queries, never()).rolesInCountry(anyString());
    }

    @Test
    void bucketCountIsBounded() throws Exception {
        mvc.perform(get("/api/v1/insights/countries/IN/distribution").param("buckets", "10000"))
                .andExpect(status().isBadRequest());
        verify(queries, never()).distribution(anyString(), anyInt());
    }
}
