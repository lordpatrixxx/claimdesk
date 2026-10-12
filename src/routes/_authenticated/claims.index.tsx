import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ClaimTable } from "@/components/ClaimTable";

export const Route = createFileRoute("/_authenticated/claims/")({
  head: () => ({ meta: [{ title: "My claims — Student Reimbursement" }] }),
  component: MyClaims,
});

function MyClaims() {
  const claims = useQuery({
    queryKey: ["claims", "all"],
    queryFn: async () =>
      (await supabase.from("claims").select("id, claim_no, title, status, total_claimed, created_at").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">My claims</h1>
        <Button asChild><Link to="/claims/new">New claim</Link></Button>
      </div>
      <ClaimTable rows={claims.data ?? []} loading={claims.isLoading} />
    </div>
  );
}
