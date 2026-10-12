package edu.demo.reimbursement.service;

import edu.demo.reimbursement.domain.*;
import edu.demo.reimbursement.domain.exception.ClaimValidationException;
import edu.demo.reimbursement.domain.exception.InvalidTransitionException;
import edu.demo.reimbursement.policy.ClaimValidationPolicy;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Owns the approval transition rules:
 * Draft → Submitted → Under Review → Changes Requested / Rejected / Approved,
 * and Changes Requested → Submitted (resubmission).
 */
@Service
public class ClaimWorkflowService {

    private static final Map<ClaimAction, Set<ClaimStatus>> ALLOWED_FROM = new EnumMap<>(ClaimAction.class);
    private static final Map<ClaimAction, ClaimStatus> TARGET = new EnumMap<>(ClaimAction.class);

    static {
        ALLOWED_FROM.put(ClaimAction.SUBMIT, Set.of(ClaimStatus.DRAFT, ClaimStatus.CHANGES_REQUESTED));
        ALLOWED_FROM.put(ClaimAction.START_REVIEW, Set.of(ClaimStatus.SUBMITTED));
        ALLOWED_FROM.put(ClaimAction.REQUEST_CHANGES, Set.of(ClaimStatus.UNDER_REVIEW));
        ALLOWED_FROM.put(ClaimAction.REJECT, Set.of(ClaimStatus.UNDER_REVIEW));
        ALLOWED_FROM.put(ClaimAction.APPROVE, Set.of(ClaimStatus.UNDER_REVIEW));

        TARGET.put(ClaimAction.SUBMIT, ClaimStatus.SUBMITTED);
        TARGET.put(ClaimAction.START_REVIEW, ClaimStatus.UNDER_REVIEW);
        TARGET.put(ClaimAction.REQUEST_CHANGES, ClaimStatus.CHANGES_REQUESTED);
        TARGET.put(ClaimAction.REJECT, ClaimStatus.REJECTED);
        TARGET.put(ClaimAction.APPROVE, ClaimStatus.APPROVED);
    }

    private final List<ClaimValidationPolicy> policies;

    public ClaimWorkflowService(List<ClaimValidationPolicy> policies) {
        this.policies = List.copyOf(policies);
    }

    public TransitionResult evaluate(Claim claim, ClaimAction action, Actor actor) {
        checkPermission(action, actor);

        ClaimStatus from = claim.getStatus();
        if (!ALLOWED_FROM.get(action).contains(from)) {
            throw new InvalidTransitionException("Cannot " + action + " a claim that is " + from);
        }

        List<String> warnings = new ArrayList<>();
        if (action == ClaimAction.SUBMIT) {
            List<String> problems = new ArrayList<>();
            for (ClaimValidationPolicy policy : policies) {
                problems.addAll(policy.validate(claim));   // polymorphic call
            }
            if (!problems.isEmpty()) throw new ClaimValidationException(problems);
        }

        ClaimStatus to = TARGET.get(action);
        claim.moveTo(to);
        return new TransitionResult(from, to, claim.totalClaimed(), warnings);
    }

    private void checkPermission(ClaimAction action, Actor actor) {
        switch (action) {
            case SUBMIT -> {
                if (!actor.has(Role.STUDENT) || !actor.isClaimOwner())
                    throw new InvalidTransitionException("Only the student who owns the claim can submit it");
            }
            case START_REVIEW, REQUEST_CHANGES, REJECT, APPROVE -> {
                if (!actor.has(Role.FACULTY))
                    throw new InvalidTransitionException("Only faculty can review claims");
                if (actor.isClaimOwner())
                    throw new InvalidTransitionException("You cannot review your own claim");
            }
        }
    }
}
