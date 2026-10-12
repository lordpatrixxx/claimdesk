package edu.demo.reimbursement.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "service.api-key=test-key-0123456789abcdef")
@AutoConfigureMockMvc
class ClaimControllerTest {

    @Autowired
    MockMvc mvc;

    private static final String BODY = """
        {"action":"SUBMIT","actor":{"userId":"u1","roles":["STUDENT"],"claimOwner":true},
         "claim":{"id":"c1","title":"Tech fest","purpose":"Stall materials for tech fest","status":"DRAFT","version":1,
           "items":[{"id":"i1","description":"Chart paper","category":"STATIONERY","expenseDate":"%s","claimedAmount":"650.00"}]}}
        """.formatted(java.time.LocalDate.now().minusDays(1));

    @Test
    void rejectsMissingKey() throws Exception {
        mvc.perform(post("/api/v1/claims/evaluate-transition").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void evaluatesWithValidKey() throws Exception {
        mvc.perform(post("/api/v1/claims/evaluate-transition")
                        .header("X-Service-Key", "test-key-0123456789abcdef")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.toStatus").value("SUBMITTED"))
                .andExpect(jsonPath("$.totalClaimed").value("650.00"));
    }

    @Test
    void healthIsPublic() throws Exception {
        mvc.perform(get("/health")).andExpect(status().isOk());
    }
}
