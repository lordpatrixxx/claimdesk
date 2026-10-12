import { Link } from "@tanstack/react-router";
import { formatINR } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

type Row = { id: string; claim_no: string; title: string; status: string; total_claimed: number | null };

export function ClaimTable({ rows, loading }: { rows: Row[]; loading?: boolean }) {
  if (loading) return <p className="mt-4 text-sm text-muted-foreground">Loading…</p>;
  if (!rows.length)
    return <p className="mt-4 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No claims yet.</p>;
  return (
    <div className="mt-3 divide-y rounded-lg border bg-card">
      {rows.map((c) => (
        <Link key={c.id} to="/claims/$id" params={{ id: c.id }} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/50">
          <div className="min-w-0">
            <div className="tabular text-xs text-muted-foreground">{c.claim_no}</div>
            <div className="truncate font-medium">{c.title}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="tabular text-sm">{c.total_claimed === null ? "Not submitted" : formatINR(c.total_claimed)}</span>
            <StatusBadge status={c.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
