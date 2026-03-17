import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function requireSuperAdminAccess(params: { nextPath: string }) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(params.nextPath)}`);
  }

  const email = (user.email ?? "").toLowerCase();
  const allow = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length === 0 || !allow.includes(email)) {
    redirect("/");
  }

  return { userId: user.id, email: user.email ?? null };
}
