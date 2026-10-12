package edu.demo.reimbursement.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** JSON request/response shapes. Amounts travel as strings like "650.00". */
public final class ClaimDtos {
    private ClaimDtos() { }

    public record ActorDto(@NotBlank String userId, @NotNull List<String> roles, boolean claimOwner) { }

    public record ItemDto(@NotBlank String id, String description, String category,
                          LocalDate expenseDate, @NotNull BigDecimal claimedAmount) { }

    public record ClaimDto(@NotBlank String id, String title, String purpose,
                           @NotBlank String status, int version,
                           @NotNull @Size(max = 200) List<@Valid ItemDto> items) { }

    public record TransitionRequest(@NotBlank String action, @NotNull @Valid ActorDto actor,
                                    @NotNull @Valid ClaimDto claim) { }

    public record TransitionResponse(boolean allowed, String fromStatus, String toStatus,
                                     String totalClaimed, List<String> warnings, String trace) { }

    public record ErrorResponse(String error, List<String> messages) { }
}
