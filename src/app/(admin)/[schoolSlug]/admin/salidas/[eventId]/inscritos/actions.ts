"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";

const Schema = z.object({
  schoolSlug: z.string().min(1),
  eventId: z.string().uuid(),
});

export async function cancelTrip(formData: FormData) {
  const parsed = Schema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    eventId: formData.get("eventId"),
  });
  if (!parsed.success) redirect("/");

  const { schoolSlug, eventId } = parsed.data;
  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/inscritos`,
  });

  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), is_visible: true })
    .eq("id", eventId)
    .eq("school_id", school.id);

  if (error) {
    redirect(`/${schoolSlug}/admin?err=${encodeURIComponent("No se pudo cancelar la salida.")}`);
  }

  redirect(`/${schoolSlug}/admin?ok=${encodeURIComponent("Salida cancelada.")}`);
}

export async function closeTrip(formData: FormData) {
  const parsed = Schema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    eventId: formData.get("eventId"),
  });
  if (!parsed.success) redirect("/");

  const { schoolSlug, eventId } = parsed.data;
  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/inscritos`,
  });

  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("events")
    .update({ status: "closed", closed_at: new Date().toISOString(), is_visible: true })
    .eq("id", eventId)
    .eq("school_id", school.id);

  if (error) {
    redirect(`/${schoolSlug}/admin?err=${encodeURIComponent("No se pudo cerrar la salida.")}`);
  }

  redirect(`/${schoolSlug}/admin?ok=${encodeURIComponent("Inscripciones cerradas.")}`);
}

export async function reopenTrip(formData: FormData) {
  const parsed = Schema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    eventId: formData.get("eventId"),
  });
  if (!parsed.success) redirect("/");

  const { schoolSlug, eventId } = parsed.data;
  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/inscritos`,
  });

  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("events")
    .update({ status: "scheduled", cancelled_at: null, closed_at: null })
    .eq("id", eventId)
    .eq("school_id", school.id);

  if (error) {
    redirect(`/${schoolSlug}/admin?err=${encodeURIComponent("No se pudo reabrir.")}`);
  }

  redirect(`/${schoolSlug}/admin?ok=${encodeURIComponent("Salida reabierta.")}`);
}
