package edu.demo.reimbursement.api;

import edu.demo.reimbursement.api.ClaimDtos.*;
import edu.demo.reimbursement.domain.*;
import edu.demo.reimbursement.service.ClaimWorkflowService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

/** Thin controller: converts JSON to domain objects and delegates to the service. */
@RestController
@RequestMapping("/api/v1/claims")
public class ClaimController {

    private final ClaimWorkflowService workflow;

    public ClaimController(ClaimWorkflowService workflow) {
        this.workflow = workflow;
    }

    @PostMapping("/evaluate-transition")
    public TransitionResponse evaluate(@Valid @RequestBody TransitionRequest request) {
        Claim claim = toDomain(request.claim());
        ClaimAction action = ClaimAction.valueOf(request.action().toUpperCase(Locale.ROOT));
        TransitionResult result = workflow.evaluate(claim, action, toActor(request.actor()));
        return new TransitionResponse(true, result.fromStatus().name(), result.toStatus().name(),
                result.totalClaimed().toPlainString(), result.warnings(),
                "java-reimbursement-service/1.0 " + action + " " + Instant.now());
    }

    private static Claim toDomain(ClaimDto dto) {
        Claim claim = new Claim(dto.id(), dto.title(), dto.purpose(),
                ClaimStatus.valueOf(dto.status().toUpperCase(Locale.ROOT)), dto.version());
        for (ItemDto item : dto.items()) {
            ExpenseCategory category = item.category() == null ? ExpenseCategory.OTHER
                    : ExpenseCategory.valueOf(item.category().toUpperCase(Locale.ROOT));
            claim.addItem(new ExpenseItem(item.id(), item.description(), category,
                    item.expenseDate(), item.claimedAmount()));
        }
        return claim;
    }

    private static Actor toActor(ActorDto dto) {
        Set<Role> roles = EnumSet.noneOf(Role.class);
        for (String r : dto.roles()) roles.add(Role.valueOf(r.toUpperCase(Locale.ROOT)));
        return new Actor(dto.userId(), roles, dto.claimOwner());
    }
}
