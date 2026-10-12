package edu.demo.reimbursement.policy;

import edu.demo.reimbursement.domain.Claim;
import edu.demo.reimbursement.domain.ExpenseItem;
import edu.demo.reimbursement.domain.Money;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Default rules every claim must satisfy before submission. */
@Component
public class StandardClaimValidationPolicy implements ClaimValidationPolicy {

    public static final int MAX_ITEMS = 50;
    public static final int MAX_AGE_DAYS = 180;

    private final Clock clock;

    public StandardClaimValidationPolicy() {
        this(Clock.systemDefaultZone());
    }

    public StandardClaimValidationPolicy(Clock clock) {
        this.clock = clock;
    }

    @Override
    public List<String> validate(Claim claim) {
        List<String> problems = new ArrayList<>();
        if (claim.getTitle().length() < 3) problems.add("Claim title must be at least 3 characters");
        if (claim.getPurpose().length() < 10) problems.add("Describe the actual purchase purpose (at least 10 characters)");
        if (claim.getItems().isEmpty()) problems.add("Add at least one expense item");
        if (claim.getItems().size() > MAX_ITEMS) problems.add("A claim can have at most " + MAX_ITEMS + " expense items");

        LocalDate today = LocalDate.now(clock);
        int index = 1;
        for (ExpenseItem item : claim.getItems()) {
            String label = "Item " + index++;
            if (item.getDescription().isEmpty()) problems.add(label + ": description is required");
            BigDecimal amount = item.getClaimedAmount();
            if (amount.compareTo(BigDecimal.ZERO) <= 0) problems.add(label + ": amount must be greater than ₹0");
            if (amount.compareTo(Money.MAX_ITEM_AMOUNT) > 0) problems.add(label + ": amount exceeds the ₹1,00,000 per-item limit");
            if (item.getExpenseDate() == null) {
                problems.add(label + ": expense date is required");
            } else {
                if (item.getExpenseDate().isAfter(today)) problems.add(label + ": expense date cannot be in the future");
                if (item.getExpenseDate().isBefore(today.minusDays(MAX_AGE_DAYS)))
                    problems.add(label + ": expense is older than " + MAX_AGE_DAYS + " days");
            }
        }
        return problems;
    }
}
