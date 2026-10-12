package edu.demo.reimbursement.domain;

/** Actions a user can ask the workflow to perform on a claim. */
public enum ClaimAction {
    SUBMIT, START_REVIEW, REQUEST_CHANGES, REJECT, APPROVE
}
