package edu.demo.reimbursement.domain;

/** Approval workflow states. Settlement status is tracked separately. */
public enum ClaimStatus {
    DRAFT, SUBMITTED, UNDER_REVIEW, CHANGES_REQUESTED, REJECTED, APPROVED;

    public boolean isEditableByStudent() {
        return this == DRAFT || this == CHANGES_REQUESTED;
    }

    public boolean isFinal() {
        return this == REJECTED || this == APPROVED;
    }
}
