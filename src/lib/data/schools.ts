import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { School } from "@/types/domain";

export async function getAllSchools(): Promise<School[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("schools")
    .select("id, slug, name, timezone, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as School[];
}

export async function getSchoolBySlug(slug: string): Promise<School | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("schools")
    .select("id, slug, name, timezone, created_at, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as School | null) ?? null;
}
