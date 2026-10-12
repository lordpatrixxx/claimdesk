# OOP concept mapping (Stage 1)

Paths are under `java-service/src/main/java/edu/demo/reimbursement/`. Rows marked *planned* are added in later stages.

| Concept | Where | What to look at |
|---|---|---|
| Class & object | `domain/Claim.java`, `domain/ExpenseItem.java` | A `Claim` object holds a list of `ExpenseItem` objects |
| Encapsulation | `domain/Claim.java` | Private fields; status changes only via `moveTo()` called by the workflow service; `getItems()` returns an unmodifiable list |
| Constructors | `domain/ExpenseItem.java` | Validating constructor normalises the amount through `Money.normalize` |
| Method overloading | `domain/ExpenseItem.java` | Two constructors: full one and `(id, description, amount)` convenience one |
| Interface | `policy/ClaimValidationPolicy.java` | `validate(Claim)` contract |
| Polymorphism | `service/ClaimWorkflowService.evaluate` | Loops over `List<ClaimValidationPolicy>` and calls `validate` on each implementation |
| Enums | `domain/ClaimStatus.java`, `ClaimAction.java`, `Role.java`, `ExpenseCategory.java` | Type-safe states; `ClaimStatus.isEditableByStudent()` |
| Custom exceptions | `domain/exception/InvalidTransitionException.java`, `ClaimValidationException.java` | Thrown by the workflow, mapped to HTTP 409/422 in `api/ApiExceptionHandler.java` |
| Collections | `ClaimWorkflowService` (`EnumMap`, `Set.of`), `Claim` (`ArrayList`) | Transition table and item lists |
| Streams | `Claim.totalClaimed()` | `stream().map(...).reduce(Money.ZERO, BigDecimal::add)` |
| BigDecimal money | `domain/Money.java` | No floating point for rupees |
| Records | `domain/TransitionResult.java`, `api/ClaimDtos.java` | Immutable data carriers |
| Abstract class `ExpenseEvidence` + `ReceiptEvidence`, `UpiScreenshotEvidence` | *planned (Stage 2)* | Polymorphic evidence validation |
| Report interface, file/stream handling | *planned (Stage 3–4)* | CSV report generation |
| Bounded executor | *planned (Stage 3–4)* | Batch duplicate checks with shutdown |

Tests: `java-service/src/test/java/...` — `ClaimWorkflowServiceTest` (9 tests), `ClaimControllerTest` (3 tests incl. service-key auth).
