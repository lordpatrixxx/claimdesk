import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FilePlus2, FileText, Info, LayoutDashboard, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/useSession";
import { DemoNotice } from "./DemoNotice";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/claims/new", label: "New claim", icon: FilePlus2 },
  { to: "/claims", label: "My claims", icon: FileText },
  { to: "/about", label: "About", icon: Info },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-sidebar text-sidebar-foreground md:w-60 md:shrink-0">
        <div className="flex items-center justify-between px-5 py-5 md:block">
          <Link to="/dashboard" className="block">
            <div className="font-display text-lg leading-tight text-sidebar-accent-foreground">Reimburse</div>
            <div className="text-xs text-sidebar-foreground/70">Claims &amp; advance settlement</div>
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary" }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-sidebar-border px-5 py-4 text-xs md:mt-8 md:block">
          <div className="truncate text-sidebar-accent-foreground">{me?.student?.full_name ?? me?.email}</div>
          <div className="mt-0.5 capitalize text-sidebar-foreground/70">{me?.roles.join(", ") || "—"}</div>
          <button onClick={signOut} className="mt-3 flex items-center gap-1.5 hover:text-sidebar-primary">
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1">
        <DemoNotice />
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">{children}</div>
        <button onClick={signOut} className="mx-5 mb-6 text-sm text-muted-foreground underline md:hidden">
          Sign out
        </button>
      </main>
    </div>
  );
}
