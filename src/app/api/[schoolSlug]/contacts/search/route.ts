import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSchoolBySlug } from "@/lib/data/schools";

const QuerySchema = z.object({
  q: z.string().min(1).max(80),
});

export async function GET(req: Request, ctx: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug } = await ctx.params;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ contacts: [] }, { status: 200 });
  }

  const school = await getSchoolBySlug(schoolSlug);
  if (!school) {
    return NextResponse.json({ contacts: [] }, { status: 200 });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("school_members")
    .select("id")
    .eq("school_id", school.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const q = parsed.data.q.trim();

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("contacts")
    .select("id, full_name, phone_e164")
    .eq("school_id", school.id)
    .or(`full_name.ilike.%${q}%,phone_e164.ilike.%${q.replace(/\s+/g, "").replace(/%/g, "")}%`)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  return NextResponse.json({
    contacts: (data ?? []).map((c) => ({
      id: c.id,
      fullName: c.full_name,
      phoneE164: c.phone_e164,
    })),
  });
}
