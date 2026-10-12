<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Authoritative reimbursement rules (validation, transitions, settlement, duplicates, reports) live in `java-service/` (Spring Boot); TypeScript must not reimplement them — why: academic Java OOP requirement.
- Server functions load records and roles from the DB, call Java via `src/lib/java.server.ts`, then persist through version-checked SQL functions (e.g. `apply_claim_transition`) with the admin client — why: browser input is never trusted and concurrent edits must not overwrite.
- Workflow-protected claim columns are guarded by the `protect_claim_columns` trigger; students edit only drafts — why: enforce permissions in the database, not the UI.
- Money is BigDecimal in Java, numeric(12,2) in Postgres, and decimal strings across the wire — why: no floating-point rupees.
