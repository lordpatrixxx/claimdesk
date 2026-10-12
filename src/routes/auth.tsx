import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => z.object({ redirect: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Student Reimbursement" },
      { name: "description", content: "Sign in or register to submit and track reimbursement claims." },
      { property: "og:title", content: "Sign in — Student Reimbursement" },
      { property: "og:description", content: "Sign in or register to submit and track reimbursement claims." },
    ],
  }),
  component: AuthPage,
});

function safePath(p?: string) {
  if (!p) return "/dashboard";
  try {
    const u = new URL(p, "http://x");
    return u.pathname.startsWith("/") && !u.pathname.startsWith("//") ? u.pathname + u.search : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: safePath(redirect) });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: {
          full_name: String(f.get("full_name")).trim(),
          prn: String(f.get("prn")).trim().toUpperCase(),
          department: String(f.get("department")).trim(),
          year: String(f.get("year")).trim(),
          division: String(f.get("division")).trim(),
        },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-navy p-12 text-navy-foreground md:flex md:flex-col md:justify-end">
        <h1 className="text-4xl leading-tight">Claims, approvals and settlements in one place.</h1>
        <p className="mt-4 text-navy-foreground/70">Academic demo — fictional bank data only.</p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-2xl">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">Open the confirmation link we sent, then sign in.</p>
            </div>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Register as student</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={signIn} className="mt-6 space-y-4">
                  <Field name="email" label="Email" type="email" />
                  <Field name="password" label="Password" type="password" />
                  <Button className="w-full" disabled={busy}>Sign in</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signUp} className="mt-6 space-y-3">
                  <Field name="full_name" label="Full name" />
                  <Field name="prn" label="PRN" />
                  <div className="grid grid-cols-3 gap-2">
                    <Field name="department" label="Dept." defaultValue="Information Technology" />
                    <Field name="year" label="Year" defaultValue="Second Year" />
                    <Field name="division" label="Div." defaultValue="B" />
                  </div>
                  <Field name="email" label="Email" type="email" />
                  <Field name="password" label="Password" type="password" minLength={8} />
                  <Button className="w-full" disabled={busy}>Create account</Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ name, label, ...rest }: { name: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required {...rest} />
    </div>
  );
}
