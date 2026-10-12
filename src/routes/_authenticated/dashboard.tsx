import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/useSession";
import { getJavaStatus } from "@/lib/claims.functions";
import { maskAccount } from "@/lib/format";
import { ClaimTable } from "@/components/ClaimTable";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Student Reimbursement" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: me } = useMe();
  const javaStatusFn = useServerFn(getJavaStatus);
  const java = useQuery({ queryKey: ["java-status"], queryFn: () => javaStatusFn() });

  const claims = useQuery({
    queryKey: ["claims", "recent"],
    queryFn: async () =>
      (await supabase.from("claims").select("id, claim_no, title, status, total_claimed, created_at").order("created_at", { ascending: false }).limit(5)).data ?? [],
  });
  const beneficiary = useQuery({
    enabled: !!me?.student,
    queryKey: ["beneficiary", me?.student?.id],
    queryFn: async () =>
      (await supabase.from("beneficiary_profiles").select("*").eq("student_id", me!.student!.id).eq("is_current", true).maybeSingle()).data,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Hello{me?.student ? `, ${me.student.full_name.split(" ")[0]}` : ""}</h1>
          {me?.student && (
            <p className="mt-1 text-sm text-muted-foreground">
              {me.student.prn} · {me.student.department} · {me.student.year} · Div {me.student.division}
            </p>
          )}
        </div>
        {me?.student && <Button asChild><Link to="/claims/new">New claim</Link></Button>}
      </div>

      {me && !me.student && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          Your account isn't linked to a student record yet, so you can't create claims. Ask finance to link it.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-medium text-muted-foreground">Java business service</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${java.data?.ok ? "bg-success" : java.isLoading ? "bg-muted-foreground" : "bg-destructive"}`} />
            <span className="font-medium">{java.isLoading ? "Checking…" : java.data?.ok ? "Connected" : "Unavailable"}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{java.data?.detail}</p>
          {!java.isLoading && !java.data?.ok && (
            <p className="mt-2 text-xs text-muted-foreground">Claims can be drafted, but submitting needs the Java service.</p>
          )}
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-medium text-muted-foreground">Reimbursement beneficiary (you)</h2>
          {beneficiary.data ? (
            <div className="mt-2 text-sm">
              <div className="font-medium">{beneficiary.data.account_holder}</div>
              <div className="text-muted-foreground">
                {beneficiary.data.bank_name} · <span className="tabular">{maskAccount(beneficiary.data.account_identifier)}</span> · {beneficiary.data.ifsc}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Profile version {beneficiary.data.version} · demo data</div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No beneficiary profile saved yet. Finance maintains this.</p>
          )}
        </section>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Recent claims</h2>
          <Link to="/claims" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <ClaimTable rows={claims.data ?? []} loading={claims.isLoading} />
      </section>
    </div>
  );
}
