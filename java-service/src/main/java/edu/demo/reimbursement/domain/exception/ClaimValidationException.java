package edu.demo.reimbursement.domain.exception;

import java.util.List;

/** Thrown when claim data breaks one or more validation rules. */
public class ClaimValidationException extends RuntimeException {
    private final List<String> problems;

    public ClaimValidationException(List<String> problems) {
        super(String.join("; ", problems));
        this.problems = List.copyOf(problems);
    }

    public List<String> getProblems() {
        return problems;
    }
}
