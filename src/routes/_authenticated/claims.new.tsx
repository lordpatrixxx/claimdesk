import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/useSession";
import { CATEGORIES } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/claims/new")({
  head: () => ({ meta: [{ title: "New claim — Student Reimbursement" }] }),
  component: NewClaim,
});

type Item = { description: string; vendor_name: string; category: string; expense_date: string; claimed_amount: string };
const blank = (): Item => ({ description: "", vendor_name: "", category: "other", expense_date: "", claimed_amount: "" });
const AMOUNT_RE = /^\d{1,6}(\.\d{1,2})?$/;

function NewClaim() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [items, setItems] = useState<Item[]>([blank()]);
  const [busy, setBusy] = useState(false);

  const update = (i: number, k: keyof Item, v: string) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  async function save() {
    if (!me?.student) { toast.error("Your account isn't linked to a student record."); return; }
    const bad = items.findIndex((x) => !x.description.trim() || !x.expense_date || !AMOUNT_RE.test(x.claimed_amount));
    if (!title.trim() || !purpose.trim()) { toast.error("Add a title and the purchase purpose."); return; }
    if (bad >= 0) { toast.error(`Item ${bad + 1}: add a description, date and an amount like 650 or 650.50.`); return; }
    setBusy(true);
    const { data: claim, error } = await supabase
      .from("claims")
      .insert({ student_id: me.student.id, title: title.trim(), purpose: purpose.trim(), created_by: me.userId })
      .select("id")
      .single();
    if (error || !claim) {
      setBusy(false);
      { toast.error(error?.message ?? "Could not create claim"); return; }
    }
    const { error: itemErr } = await supabase.from("expense_items").insert(
      items.map((x, i) => ({
        claim_id: claim.id,
        position: i,
        description: x.description.trim(),
        vendor_name: x.vendor_name.trim() || null,
        category: x.category as "other",
        expense_date: x.expense_date,
        claimed_amount: x.claimed_amount as unknown as number,
      })),
    );
    setBusy(false);
    if (itemErr) { toast.error(itemErr.message); return; }
    toast.success("Draft saved");
    navigate({ to: "/claims/$id", params: { id: claim.id } });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Step 1 of 2 · Draft</p>
        <h1 className="text-3xl">New claim</h1>
      </div>

      <section className="space-y-4 rounded-lg border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Claim title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Tech fest stall materials" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="purpose">Actual purchase purpose</Label>
          <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={1000} placeholder="What was bought and why" />
        </div>
        {me?.student && (
          <p className="text-sm text-muted-foreground">
            Reimbursement goes to: <span className="font-medium text-foreground">{me.student.full_name}</span> ({me.student.prn}) — not the vendor.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl">Expense items</h2>
        {items.map((x, i) => (
          <div key={i} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-12">
            <div className="md:col-span-4 space-y-1.5">
              <Label>Description</Label>
              <Input value={x.description} onChange={(e) => update(i, "description", e.target.value)} maxLength={200} />
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <Label>Vendor (who was paid)</Label>
              <Input value={x.vendor_name} onChange={(e) => update(i, "vendor_name", e.target.value)} maxLength={120} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Category</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                value={x.category}
                onChange={(e) => update(i, "category", e.target.value)}
              >
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={x.expense_date} onChange={(e) => update(i, "expense_date", e.target.value)} />
            </div>
            <div className="md:col-span-1 space-y-1.5">
              <Label>₹</Label>
              <Input inputMode="decimal" className="tabular" value={x.claimed_amount} onChange={(e) => update(i, "claimed_amount", e.target.value)} />
            </div>
            {items.length > 1 && (
              <button className="md:col-span-12 flex items-center gap-1 text-xs text-destructive" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}>
                <Trash2 className="size-3.5" /> Remove item
              </button>
            )}
          </div>
        ))}
        <Button variant="outline" onClick={() => setItems((xs) => [...xs, blank()])}><Plus className="size-4" /> Add item</Button>
        <p className="text-xs text-muted-foreground">Totals are calculated by the Java service when you submit. Receipt upload arrives in the next stage.</p>
      </section>

      <div className="flex justify-end">
        <Button size="lg" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save draft & review"}</Button>
      </div>
    </div>
  );
}
