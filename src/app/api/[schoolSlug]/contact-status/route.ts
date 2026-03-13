import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSchoolBySlug } from "@/lib/data/schools";
import { normalizePhoneToE164Spain } from "@/lib/utils/phone";

const QuerySchema = z.object({
  phone: z.string().min(1),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ schoolSlug: string }> }
) {
  const { schoolSlug } = await ctx.params;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ phone: url.searchParams.get("phone") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ isFrequent: false }, { status: 200 });
  }

  const phoneE164 = normalizePhoneToE164Spain(parsed.data.phone);
  if (!phoneE164) {
    return NextResponse.json({ isFrequent: false }, { status: 200 });
  }

  const school = await getSchoolBySlug(schoolSlug);
  if (!school) {
    return NextResponse.json({ isFrequent: false }, { status: 200 });
  }

  const supabase = getSupabaseAdmin();

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("reservations_count, is_frequent_override")
    .eq("school_id", school.id)
    .eq("phone_e164", phoneE164)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ isFrequent: false }, { status: 200 });
  }

  const reservationsCount = contact?.reservations_count ?? 0;
  const override = Boolean(contact?.is_frequent_override);
  return NextResponse.json({ isFrequent: override || reservationsCount >= 2 }, { status: 200 });
}
