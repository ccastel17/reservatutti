"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";

const Schema = z.object({
  schoolSlug: z.string().min(1),
});

export async function unpublishAllEvents(formData: FormData) {
  const parsed = Schema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
  });
  if (!parsed.success) redirect("/");

  const { schoolSlug } = parsed.data;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin`,
  });

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("events").update({ is_visible: false }).eq("school_id", school.id);

  if (error) {
    redirect(
      `/${schoolSlug}/admin?err=${encodeURIComponent("No se pudo despublicar.")}`
    );
  }

  redirect(
    `/${schoolSlug}/admin?ok=${encodeURIComponent(
      "Publicaciones despublicadas."
    )}`
  );
}
