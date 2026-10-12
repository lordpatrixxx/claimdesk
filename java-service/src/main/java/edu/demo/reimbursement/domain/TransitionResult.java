package edu.demo.reimbursement.domain;

import java.math.BigDecimal;
import java.util.List;

/** What the workflow decided. The web server persists this atomically. */
public record TransitionResult(
        ClaimStatus fromStatus,
        ClaimStatus toStatus,
        BigDecimal totalClaimed,
        List<String> warnings) { }
