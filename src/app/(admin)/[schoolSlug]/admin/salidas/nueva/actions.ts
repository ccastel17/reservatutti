"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";

const Schema = z.object({
  schoolSlug: z.string().min(1),
  category: z.enum(["trip", "theory", "practice"]).optional().default("trip"),
  title: z.string().min(2).max(80),
  date: z.string().min(10), // YYYY-MM-DD
  time: z.string().min(4),  // HH:mm
  durationHours: z.coerce.number().min(0.5).max(168),
  capacity: z.coerce.number().int().min(1).max(200),
  requiresMinCapacity: z.coerce.boolean().optional().default(false),
  minCapacity: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return undefined;
      return Number(value);
    },
    z.number().int().min(1).max(200).optional()
  ),
  meetingPoint: z.string().optional(),
  description: z.string().optional(),
});

export async function createTrip(formData: FormData) {
  const parsed = Schema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    category: formData.get("category") ?? undefined,
    title: formData.get("title"),
    date: formData.get("date"),
    time: formData.get("time"),
    durationHours: formData.get("durationHours"),
    capacity: formData.get("capacity"),
    requiresMinCapacity: formData.get("requiresMinCapacity"),
    minCapacity: formData.get("minCapacity"),
    meetingPoint: formData.get("meetingPoint") ?? undefined,
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    redirect("/");
  }

  const {
    schoolSlug,
    category,
    title,
    date,
    time,
    durationHours,
    capacity,
    requiresMinCapacity,
    minCapacity,
    meetingPoint,
    description,
  } =
    parsed.data;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/nueva`,
  });

  const durationMinutes = Math.round(durationHours * 60);
  const startsAt = new Date(`${date}T${time}:00`);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  const supabase = await getSupabaseServer();
  const { data: inserted, error } = await supabase
    .from("events")
    .insert({
      school_id: school.id,
      title: title.trim(),
      description: description?.trim() ? description.trim() : null,
      meeting_point: meetingPoint?.trim() ? meetingPoint.trim() : null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      capacity,
      min_capacity: requiresMinCapacity ? (minCapacity ?? null) : null,
      requires_min_capacity: Boolean(requiresMinCapacity),
      is_visible: true,
      status: "scheduled",
      category,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/${schoolSlug}/admin?err=${encodeURIComponent("No se pudo crear la salida.")}`);
  }

  redirect(
    `/${schoolSlug}/admin/salidas/${inserted.id}/inscritos?ok=${encodeURIComponent(
      "Salida creada."
    )}&share=${encodeURIComponent(`/${schoolSlug}/salidas/${inserted.id}`)}`
  );
}
