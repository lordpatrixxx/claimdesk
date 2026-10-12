import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Me = {
  userId: string;
  email: string;
  roles: string[];
  student: { id: string; prn: string; full_name: string; department: string; year: string; division: string } | null;
};

export const meQueryKey = ["me"];

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async (): Promise<Me | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: roles }, { data: student }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
        supabase
          .from("students")
          .select("id, prn, full_name, department, year, division")
          .eq("user_id", u.user.id)
          .maybeSingle(),
      ]);
      return {
        userId: u.user.id,
        email: u.user.email ?? "",
        roles: (roles ?? []).map((r) => r.role),
        student: student ?? null,
      };
    },
  });
}
