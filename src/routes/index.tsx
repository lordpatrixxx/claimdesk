import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/DemoNotice";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Reimbursement & Advance Settlement" },
      { name: "description", content: "Submit college expense claims, get faculty approval and settle advances — with business rules run by a Java service." },
      { property: "og:title", content: "Student Reimbursement & Advance Settlement" },
      { property: "og:description", content: "Expense claims, faculty approval and advance settlement for students." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-navy text-navy-foreground">
      <DemoNotice />
      <div className="mx-auto flex max-w-5xl flex-col px-6 py-20 md:py-28">
        <h1 className="max-w-3xl text-4xl leading-tight md:text-6xl">
          Student reimbursement and advance settlement, done properly.
        </h1>
        <p className="mt-6 max-w-xl text-navy-foreground/75">
          Submit expenses with receipts, get them reviewed by faculty, and settle advances with exact
          rupee calculations — every rule decided by a Java business service.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Sign in or register</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-navy-foreground hover:bg-sidebar-accent hover:text-navy-foreground">
            <Link to="/about">About the project</Link>
          </Button>
        </div>
        <ol className="mt-20 grid gap-6 border-t border-sidebar-border pt-10 md:grid-cols-4">
          {["Draft a claim", "Submit for review", "Faculty decision", "Settlement"].map((s, i) => (
            <li key={s}>
              <div className="tabular text-sm text-sidebar-primary">0{i + 1}</div>
              <div className="mt-1 font-display text-lg">{s}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
