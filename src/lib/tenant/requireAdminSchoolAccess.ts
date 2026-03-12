import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSchoolBySlug } from "@/lib/data/schools";

export async function requireAdminSchoolAccess(params: {
  schoolSlug: string;
  nextPath: string;
}) {
  const school = await getSchoolBySlug(params.schoolSlug);
  if (!school) {
    redirect("/");
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(params.nextPath)}`);
  }

  const { data: membership, error } = await supabase
    .from("school_members")
    .select("id")
    .eq("school_id", school.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    redirect(`/auth/login?next=${encodeURIComponent(params.nextPath)}`);
  }

  if (!membership) {
    redirect("/");
  }

  return { school, userId: user.id };
}
