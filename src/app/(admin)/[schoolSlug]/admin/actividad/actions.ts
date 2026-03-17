"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";

const MarkReadSchema = z.object({
  schoolSlug: z.string().min(1),
  activityId: z.string().uuid(),
});

export async function markActivityRead(formData: FormData) {
  const parsed = MarkReadSchema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    activityId: formData.get("activityId"),
  });

  if (!parsed.success) redirect("/");

  const { schoolSlug, activityId } = parsed.data;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/actividad`,
  });

  const supabase = await getSupabaseServer();

  try {
    await supabase
      .from("school_activity")
      .update({ read_at: new Date().toISOString() })
      .eq("id", activityId)
      .eq("school_id", school.id);
  } catch {
    // ignore
  }

  redirect(`/${schoolSlug}/admin/actividad`);
}
