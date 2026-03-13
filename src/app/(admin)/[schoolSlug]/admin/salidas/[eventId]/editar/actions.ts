"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";

const Schema = z.object({
  schoolSlug: z.string().min(1),
  eventId: z.string().uuid(),
  title: z.string().min(2).max(80),
  meetingPoint: z.string().optional(),
  description: z.string().optional(),
});

export async function updateTripTexts(formData: FormData) {
  const parsed = Schema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    meetingPoint: formData.get("meetingPoint") ?? undefined,
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    redirect("/");
  }

  const { schoolSlug, eventId, title, meetingPoint, description } = parsed.data;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/editar`,
  });

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("events")
    .update({
      title: title.trim(),
      meeting_point: meetingPoint?.trim() ? meetingPoint.trim() : null,
      description: description?.trim() ? description.trim() : null,
    })
    .eq("id", eventId)
    .eq("school_id", school.id);

  if (error) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/editar?err=${encodeURIComponent(
        "No se pudo guardar la salida."
      )}`
    );
  }

  redirect(
    `/${schoolSlug}/admin/salidas/${eventId}/inscritos?ok=${encodeURIComponent(
      "Salida actualizada."
    )}`
  );
}
