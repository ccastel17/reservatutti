"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";

const Schema = z.object({
  schoolSlug: z.string().min(1),
  eventId: z.string().uuid(),
  category: z.enum(["trip", "theory", "practice"]).optional().default("trip"),
  title: z.string().min(2).max(80),
  date: z.string().min(10),
  time: z.string().min(4),
  durationHours: z.coerce.number().min(0.5).max(10),
  capacity: z.coerce.number().int().min(1).max(200),
  meetingPoint: z.string().optional(),
  description: z.string().optional(),
});

export async function confirmDuplicateTrip(formData: FormData) {
  const parsed = Schema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    eventId: formData.get("eventId"),
    category: formData.get("category") ?? undefined,
    title: formData.get("title"),
    date: formData.get("date"),
    time: formData.get("time"),
    durationHours: formData.get("durationHours"),
    capacity: formData.get("capacity"),
    meetingPoint: formData.get("meetingPoint") ?? undefined,
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    redirect("/");
  }

  const {
    schoolSlug,
    eventId,
    category,
    title,
    date,
    time,
    durationHours,
    capacity,
    meetingPoint,
    description,
  } = parsed.data;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/duplicar`,
  });

  const supabase = await getSupabaseServer();

  const { data: originalTrip, error: originalError } = await supabase
    .from("events")
    .select("id, capacity, status")
    .eq("id", eventId)
    .eq("school_id", school.id)
    .maybeSingle();

  if (originalError || !originalTrip) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No se pudo comprobar la salida original."
      )}`
    );
  }

  const durationMinutes = Math.round(durationHours * 60);
  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  const pendingLimit = originalTrip.capacity;

  const { data: pendingRows, error: pendingError } = await supabase
    .from("reservations")
    .select("id, participant_name")
    .eq("school_id", school.id)
    .eq("event_id", eventId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(pendingLimit);

  if (pendingError) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/duplicar?err=${encodeURIComponent(
        "No se pudo cargar la lista de espera."
      )}`
    );
  }

  const pendingIds = (pendingRows ?? []).map((r) => r.id);
  const movedNames = (pendingRows ?? [])
    .map((r) => ("participant_name" in r ? String((r as { participant_name?: unknown }).participant_name ?? "") : ""))
    .map((s) => s.trim())
    .filter(Boolean);

  const { data: inserted, error: insertError } = await supabase
    .from("events")
    .insert({
      school_id: school.id,
      title: title.trim(),
      description: description?.trim() ? description.trim() : null,
      meeting_point: meetingPoint?.trim() ? meetingPoint.trim() : null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      capacity,
      is_visible: true,
      status: "scheduled",
      category,
    })
    .select("id")
    .single();

  if (insertError) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/duplicar?err=${encodeURIComponent(
        "No se pudo crear la salida duplicada."
      )}`
    );
  }

  const newEventId = inserted.id;

  if (pendingIds.length > 0) {
    const { error: moveError } = await supabase
      .from("reservations")
      .update({ event_id: newEventId, status: "confirmed" })
      .in("id", pendingIds)
      .eq("school_id", school.id)
      .eq("event_id", eventId);

    if (moveError) {
      redirect(
        `/${schoolSlug}/admin/salidas/${eventId}/duplicar?err=${encodeURIComponent(
          "Se creó el duplicado, pero no se pudieron mover las reservas."
        )}`
      );
    }
  }

  try {
    const admin = getSupabaseAdmin();
    await admin.from("school_activity").insert({
      school_id: school.id,
      type: "trip_duplicated",
      event_id: newEventId,
      reservation_id: null,
      participant_name: null,
      participant_phone_e164: null,
      payload: {
        original_event_id: eventId,
        moved_names: movedNames,
        public_path: `/${schoolSlug}/salidas/${newEventId}`,
        starts_at: startsAt.toISOString(),
      },
    });
  } catch {
    // ignore
  }

  redirect(
    `/${schoolSlug}/admin/salidas/${newEventId}/inscritos?ok=${encodeURIComponent(
      "Salida duplicada creada."
    )}&share=${encodeURIComponent(`/${schoolSlug}/salidas/${newEventId}`)}`
  );
}
