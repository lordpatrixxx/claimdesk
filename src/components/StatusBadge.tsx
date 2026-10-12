import { cva } from "class-variance-authority";
import { STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

const badge = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    status: {
      draft: "bg-muted text-muted-foreground",
      submitted: "bg-info/12 text-info",
      under_review: "bg-accent text-accent-foreground",
      changes_requested: "bg-warning/25 text-warning-foreground",
      rejected: "bg-destructive/12 text-destructive",
      approved: "bg-success/12 text-success",
    },
  },
});

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn(badge({ status: status as "draft" }), className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
