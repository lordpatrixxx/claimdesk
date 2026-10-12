// Display-only formatting. Authoritative money calculations live in the Java service.
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

export function formatINR(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return inr.format(Number(value));
}

const ist = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const istDate = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });

export function formatIST(value: string | null | undefined) {
  return value ? `${ist.format(new Date(value))} IST` : "—";
}
export function formatDate(value: string | null | undefined) {
  return value ? istDate.format(new Date(value)) : "—";
}

export function maskAccount(id: string) {
  return id.length <= 4 ? "••••" : `•••• ${id.slice(-4)}`;
}

export const CATEGORIES = [
  ["stationery", "Stationery"],
  ["refreshment", "Refreshment"],
  ["rent", "Rent"],
  ["design_material", "Design Material"],
  ["printing", "Printing"],
  ["travel", "Travel"],
  ["equipment", "Equipment"],
  ["other", "Other"],
] as const;

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  approved: "Approved",
};
