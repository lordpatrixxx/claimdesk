import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callJava, javaHealth, JavaServiceError } from "./java.server";

type TransitionResponse = {
  allowed: boolean;
  fromStatus: string;
  toStatus: string;
  totalClaimed: string;
  warnings: string[];
  trace: string;
};

export type SubmitResult =
  | { ok: true; status: string; totalClaimed: string; trace: string }
  | { ok: false; kind: string; message: string; messages: string[] };

export const getJavaStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => javaHealth());

/**
 * Browser → this server function → Java (rules) → persist atomically.
 * Everything sent to Java is loaded here from the database; nothing comes from the browser
 * except the claim id.
 */
export const submitClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ claimId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<SubmitResult> => {
    const { supabase, userId } = context;

    const { data: claim, error } = await supabase
      .from("claims")
      .select("id, title, purpose, status, version, student_id, students!inner(user_id)")
      .eq("id", data.claimId)
      .maybeSingle();
    if (error || !claim) return { ok: false, kind: "not_found", message: "Claim not found", messages: [] };

    const [{ data: items }, { data: roles }] = await Promise.all([
      supabase
        .from("expense_items")
        .select("id, description, category, expense_date, claimed_amount")
        .eq("claim_id", claim.id)
        .order("position"),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const owner = (claim.students as unknown as { user_id: string | null }).user_id === userId;

    let result: TransitionResponse;
    try {
      result = await callJava<TransitionResponse>("/api/v1/claims/evaluate-transition", {
        action: "SUBMIT",
        actor: { userId, roles: (roles ?? []).map((r) => r.role.toUpperCase()), claimOwner: owner },
        claim: {
          id: claim.id,
          title: claim.title,
          purpose: claim.purpose,
          status: claim.status.toUpperCase(),
          version: claim.version,
          items: (items ?? []).map((i) => ({
            id: i.id,
            description: i.description,
            category: i.category.toUpperCase(),
            expenseDate: i.expense_date,
            claimedAmount: String(i.claimed_amount),
          })),
        },
      });
    } catch (e) {
      if (e instanceof JavaServiceError) return { ok: false, kind: e.kind, message: e.message, messages: e.messages };
      throw e;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: txErr } = await supabaseAdmin.rpc("apply_claim_transition", {
      _claim_id: claim.id,
      _expected_version: claim.version,
      _to_status: result.toStatus.toLowerCase() as "submitted",
      // Passed as a decimal string so Postgres numeric receives the exact Java BigDecimal value.
      _total_claimed: result.totalClaimed as unknown as number,
      _actor: userId,
      _action: "SUBMIT",
      _comment: claim.status === "changes_requested" ? "Resubmitted after corrections" : "Submitted",
      _java_trace: result.trace,
    });
    if (txErr) {
      if (txErr.message.includes("VERSION_CONFLICT"))
        return { ok: false, kind: "conflict", message: "This claim was changed by someone else. Reload and try again.", messages: [] };
      console.error(txErr);
      return { ok: false, kind: "db", message: "Could not save the result. Please try again.", messages: [] };
    }
    return { ok: true, status: result.toStatus, totalClaimed: result.totalClaimed, trace: result.trace };
  });
