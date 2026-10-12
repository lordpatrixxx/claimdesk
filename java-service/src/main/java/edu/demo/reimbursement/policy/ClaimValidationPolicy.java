package edu.demo.reimbursement.policy;

import edu.demo.reimbursement.domain.Claim;

import java.util.List;

/**
 * A validation rule set for claims. Using an interface lets us swap or add
 * policies (e.g. a stricter policy for large claims) without changing the
 * workflow service.
 */
public interface ClaimValidationPolicy {
    /** @return human-readable problems; an empty list means the claim is valid. */
    List<String> validate(Claim claim);
}
