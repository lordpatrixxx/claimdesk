import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { submitClaim } from "@/lib/claims.functions";
import { CATEGORIES, formatDate, formatINR, formatIST } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/claims/$id")({
  head: () => ({ meta: [{ title: "Claim — Student Reimbursement" }] }),
  component: ClaimDetail,
});

const catLabel = Object.fromEntries(CATEGORIES);

function ClaimDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const submitFn = useServerFn(submitClaim);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<{ message: string; messages: string[]; kind: string } | null>(null);

  const q = useQuery({
    queryKey: ["claim", id],
    queryFn: async () => {
      const [c, items, events] = await Promise.all([
        supabase.from("claims").select("*, students(full_name, prn)").eq("id", id).maybeSingle(),
        supabase.from("expense_items").select("*").eq("claim_id", id).order("position"),
        supabase.from("claim_events").select("*").eq("claim_id", id).order("created_at", { ascending: false }),
      ]);
      return { claim: c.data, items: items.data ?? [], events: events.data ?? [] };
    },
  });

  if (q.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const claim = q.data?.claim;
  if (!claim) return <p>Claim not found. <Link to="/claims" className="text-primary underline">Back to claims</Link></p>;

  const canSubmit = claim.status === "draft" || claim.status === "changes_requested";

  async function onSubmit() {
    setBusy(true);
    setProblem(null);
    try {
      const r = await submitFn({ data: { claimId: id } });
      if (r.ok) {
        toast.success(`Submitted. Java confirmed total ${formatINR(r.totalClaimed)}.`);
        qc.invalidateQueries({ queryKey: ["claim", id] });
        qc.invalidateQueries({ queryKey: ["claims"] });
      } else {
        setProblem(r);
      }
    } catch (e) {
      setProblem({ kind: "error", message: "Something went wrong while submitting.", messages: [] });
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="tabular text-sm text-muted-foreground">{claim.claim_no} · revision {claim.revision}</div>
          <h1 className="mt-1 text-3xl">{claim.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{claim.purpose}</p>
        </div>
        <StatusBadge status={claim.status} className="text-sm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Amount label="Claimed" value={claim.total_claimed} hint={claim.total_claimed === null ? "Calculated on submit" : "Confirmed by Java"} />
        <Amount label="Approved" value={claim.total_approved} hint="After faculty review" />
        <Amount label="Paid" value={null} hint="Recorded by finance" />
      </div>

      <section>
        <h2 className="text-xl">Expense items</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr><th className="px-4 py-2">Description</th><th className="px-4 py-2">Vendor</th><th className="px-4 py-2">Category</th><th className="px-4 py-2">Date</th><th className="px-4 py-2 text-right">Claimed</th></tr>
            </thead>
            <tbody className="divide-y">
              {q.data!.items.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-2">{i.description}</td>
                  <td className="px-4 py-2 text-muted-foreground">{i.vendor_name ?? "—"}</td>
                  <td className="px-4 py-2">{catLabel[i.category]}</td>
                  <td className="px-4 py-2">{formatDate(i.expense_date)}</td>
                  <td className="tabular px-4 py-2 text-right">{formatINR(i.claimed_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Beneficiary: {(claim.students as { full_name: string; prn: string } | null)?.full_name} — the student is reimbursed, not the vendor.
        </p>
      </section>

      {problem && (
        <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/8 p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <div>
            <div className="font-medium">
              {problem.kind === "rule" ? "The claim needs fixes before it can be submitted" : problem.kind === "conflict" ? "Claim changed" : "Java business service unavailable"}
            </div>
            {problem.messages.length > 0 ? (
              <ul className="mt-1 list-disc pl-5">{problem.messages.map((m) => <li key={m}>{m}</li>)}</ul>
            ) : (
              <p className="mt-1">{problem.message}</p>
            )}
            {problem.kind !== "rule" && problem.kind !== "conflict" && (
              <p className="mt-1 text-muted-foreground">Nothing was submitted. Your draft is safe.</p>
            )}
          </div>
        </div>
      )}

      {canSubmit && (
        <div className="flex justify-end">
          <Button size="lg" onClick={onSubmit} disabled={busy}>{busy ? "Checking with Java service…" : "Submit for review"}</Button>
        </div>
      )}

      <section>
        <h2 className="text-xl">History</h2>
        {q.data!.events.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Created {formatIST(claim.created_at)}. Not submitted yet.</p>
        ) : (
          <ol className="mt-3 space-y-3 border-l pl-5">
            {q.data!.events.map((e) => (
              <li key={e.id} className="text-sm">
                <div className="font-medium">{e.action.replace("_", " ").toLowerCase()} → {e.to_status?.replace("_", " ")}</div>
                <div className="text-muted-foreground">{formatIST(e.created_at)}{e.comment ? ` · ${e.comment}` : ""}</div>
                {e.java_trace && <div className="tabular mt-0.5 text-xs text-muted-foreground">{e.java_trace}</div>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Amount({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="tabular mt-1 text-2xl">{value === null ? "—" : formatINR(value)}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
