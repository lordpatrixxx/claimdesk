package edu.demo.reimbursement.service;

import edu.demo.reimbursement.domain.*;
import edu.demo.reimbursement.domain.exception.ClaimValidationException;
import edu.demo.reimbursement.domain.exception.InvalidTransitionException;
import edu.demo.reimbursement.policy.StandardClaimValidationPolicy;
import org.junit.jupiter.api.Test;

import java.time.*;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ClaimWorkflowServiceTest {

    private final Clock clock = Clock.fixed(Instant.parse("2026-10-12T06:00:00Z"), ZoneId.of("Asia/Kolkata"));
    private final ClaimWorkflowService service =
            new ClaimWorkflowService(List.of(new StandardClaimValidationPolicy(clock)));
    private final Actor owner = new Actor("u1", Set.of(Role.STUDENT), true);
    private final Actor otherStudent = new Actor("u2", Set.of(Role.STUDENT), false);
    private final Actor faculty = new Actor("f1", Set.of(Role.FACULTY), false);

    private Claim draftWith(String... amounts) {
        Claim c = new Claim("c1", "Tech fest stall", "Materials for the department tech fest stall", ClaimStatus.DRAFT, 1);
        int i = 0;
        for (String a : amounts) {
            c.addItem(new ExpenseItem("i" + i++, "Item", ExpenseCategory.STATIONERY, LocalDate.of(2026, 10, 1), Money.of(a)));
        }
        return c;
    }

    @Test
    void submitSumsItemsWithBigDecimal() {
        TransitionResult r = service.evaluate(draftWith("1200.50", "1449.50"), ClaimAction.SUBMIT, owner);
        assertEquals(ClaimStatus.SUBMITTED, r.toStatus());
        assertEquals(Money.of("2650.00"), r.totalClaimed());
    }

    @Test
    void submitRejectsEmptyClaim() {
        assertThrows(ClaimValidationException.class, () -> service.evaluate(draftWith(), ClaimAction.SUBMIT, owner));
    }

    @Test
    void submitRejectsZeroAmount() {
        ClaimValidationException e = assertThrows(ClaimValidationException.class,
                () -> service.evaluate(draftWith("0.00"), ClaimAction.SUBMIT, owner));
        assertTrue(e.getProblems().get(0).contains("greater than"));
    }

    @Test
    void submitRejectsFutureDate() {
        Claim c = new Claim("c1", "Title", "A long enough purpose", ClaimStatus.DRAFT, 1);
        c.addItem(new ExpenseItem("i", "Pens", ExpenseCategory.STATIONERY, LocalDate.of(2026, 11, 1), Money.of("50")));
        assertThrows(ClaimValidationException.class, () -> service.evaluate(c, ClaimAction.SUBMIT, owner));
    }

    @Test
    void onlyOwnerCanSubmit() {
        assertThrows(InvalidTransitionException.class,
                () -> service.evaluate(draftWith("100"), ClaimAction.SUBMIT, otherStudent));
    }

    @Test
    void cannotSubmitTwice() {
        Claim c = new Claim("c1", "Title", "A long enough purpose", ClaimStatus.SUBMITTED, 2);
        assertThrows(InvalidTransitionException.class, () -> service.evaluate(c, ClaimAction.SUBMIT, owner));
    }

    @Test
    void studentCannotApprove() {
        Claim c = new Claim("c1", "Title", "A long enough purpose", ClaimStatus.UNDER_REVIEW, 3);
        assertThrows(InvalidTransitionException.class, () -> service.evaluate(c, ClaimAction.APPROVE, owner));
    }

    @Test
    void facultyCanStartReview() {
        Claim c = new Claim("c1", "Title", "A long enough purpose", ClaimStatus.SUBMITTED, 2);
        assertEquals(ClaimStatus.UNDER_REVIEW, service.evaluate(c, ClaimAction.START_REVIEW, faculty).toStatus());
    }

    @Test
    void moneyRejectsMoreThanTwoDecimals() {
        assertThrows(IllegalArgumentException.class, () -> Money.of("10.555"));
    }
}
