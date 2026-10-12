package edu.demo.reimbursement.domain;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * A reimbursement claim. State is private; the only way to change status is
 * through {@link #moveTo(ClaimStatus)}, which the workflow service calls after
 * checking the rules.
 */
public class Claim {

    private final String id;
    private final String title;
    private final String purpose;
    private final int version;
    private ClaimStatus status;
    private final List<ExpenseItem> items = new ArrayList<>();

    public Claim(String id, String title, String purpose, ClaimStatus status, int version) {
        this.id = Objects.requireNonNull(id, "id");
        this.title = title == null ? "" : title.trim();
        this.purpose = purpose == null ? "" : purpose.trim();
        this.status = Objects.requireNonNull(status, "status");
        this.version = version;
    }

    public void addItem(ExpenseItem item) {
        items.add(Objects.requireNonNull(item));
    }

    /** Total claimed, summed with BigDecimal so no rounding drift occurs. */
    public BigDecimal totalClaimed() {
        return items.stream().map(ExpenseItem::getClaimedAmount).reduce(Money.ZERO, BigDecimal::add);
    }

    public void moveTo(ClaimStatus next) {
        this.status = next;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getPurpose() { return purpose; }
    public int getVersion() { return version; }
    public ClaimStatus getStatus() { return status; }
    public List<ExpenseItem> getItems() { return Collections.unmodifiableList(items); }
}
