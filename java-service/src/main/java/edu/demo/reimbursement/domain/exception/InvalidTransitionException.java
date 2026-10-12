package edu.demo.reimbursement.domain.exception;

/** Thrown when an action is not allowed from the claim's current status or by this user. */
public class InvalidTransitionException extends RuntimeException {
    public InvalidTransitionException(String message) {
        super(message);
    }
}
