package edu.demo.reimbursement.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

/**
 * One expense inside a claim. Several documents (receipt + UPI screenshot) may
 * support one item, but the item is counted once — the amount lives here, not
 * on the evidence.
 */
public class ExpenseItem {

    private final String id;
    private final String description;
    private final ExpenseCategory category;
    private final LocalDate expenseDate;
    private final BigDecimal claimedAmount;

    public ExpenseItem(String id, String description, ExpenseCategory category,
                       LocalDate expenseDate, BigDecimal claimedAmount) {
        this.id = Objects.requireNonNull(id, "id");
        this.description = description == null ? "" : description.trim();
        this.category = category == null ? ExpenseCategory.OTHER : category;
        this.expenseDate = expenseDate;
        this.claimedAmount = Money.normalize(claimedAmount);
    }

    /** Overloaded convenience constructor used mainly in tests. */
    public ExpenseItem(String id, String description, String amount) {
        this(id, description, ExpenseCategory.OTHER, LocalDate.now(), Money.of(amount));
    }

    public String getId() { return id; }
    public String getDescription() { return description; }
    public ExpenseCategory getCategory() { return category; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public BigDecimal getClaimedAmount() { return claimedAmount; }
}
