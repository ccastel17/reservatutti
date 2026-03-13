"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";

const PublishSchema = z.object({
  schoolSlug: z.string().min(1),
  eventId: z.string().uuid(),
});

export async function publishOccurrence(formData: FormData) {
  const parsed = PublishSchema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    eventId: formData.get("eventId"),
  });

  if (!parsed.success) {
    redirect("/");
  }

  const { schoolSlug, eventId } = parsed.data;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/ocurrencias`,
  });

  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("events")
    .update({ is_visible: true })
    .eq("id", eventId)
    .eq("school_id", school.id);

  if (error) {
    redirect(`/${schoolSlug}/admin?err=${encodeURIComponent("No se pudo publicar.")}`);
  }

  redirect(
    `/${schoolSlug}/admin?ok=${encodeURIComponent("Salida publicada.")}&share=${encodeURIComponent(
      `/${schoolSlug}/salidas/${eventId}`
    )}`
  );
}
