"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";

const Schema = z.object({
  schoolSlug: z.string().min(1),
  title: z.string().min(2).max(80),
  weekday: z.coerce.number().int().min(1).max(7),
  time: z.string().min(4),
  durationHours: z.coerce.number().min(0.5).max(10),
  capacity: z.coerce.number().int().min(1).max(200),
  requiresMinCapacity: z.coerce.boolean().optional().default(false),
  meetingPoint: z.string().optional(),
  description: z.string().optional(),
});

function nextOccurrences(params: {
  weekday: number; // 1..7
  time: string; // HH:mm
  durationMinutes: number;
  weeks: number;
}) {
  const results: Array<{ startsAt: Date; endsAt: Date }> = [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < params.weeks; i++) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() + i * 7);

    const jsDay = d.getDay(); // 0..6 (Sun..Sat)
    const isoDay = jsDay === 0 ? 7 : jsDay;
    const deltaDays = (params.weekday - isoDay + 7) % 7;

    const occ = new Date(d);
    occ.setDate(occ.getDate() + deltaDays);

    const [hh, mm] = params.time.split(":").map((x) => Number(x));
    occ.setHours(hh, mm, 0, 0);

    // Only generate future (>= now)
    if (occ.getTime() < now.getTime()) continue;

    const ends = new Date(occ.getTime() + params.durationMinutes * 60 * 1000);
    results.push({ startsAt: occ, endsAt: ends });
  }

  // Deduplicate by timestamp
  const seen = new Set<number>();
  return results.filter((r) => {
    const ts = r.startsAt.getTime();
    if (seen.has(ts)) return false;
    seen.add(ts);
    return true;
  });
}

export async function createWeeklyTemplate(formData: FormData) {
  const parsed = Schema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    title: formData.get("title"),
    weekday: formData.get("weekday"),
    time: formData.get("time"),
    durationHours: formData.get("durationHours"),
    capacity: formData.get("capacity"),
    requiresMinCapacity: formData.get("requiresMinCapacity"),
    meetingPoint: formData.get("meetingPoint") ?? undefined,
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    redirect("/");
  }

  const {
    schoolSlug,
    title,
    weekday,
    time,
    durationHours,
    capacity,
    requiresMinCapacity,
    meetingPoint,
    description,
  } =
    parsed.data;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/series/nueva`,
  });

  const durationMinutes = Math.round(durationHours * 60);

  const supabase = await getSupabaseServer();

  const { data: series, error: seriesError } = await supabase
    .from("event_series")
    .insert({
      school_id: school.id,
      title: title.trim(),
      description: description?.trim() ? description.trim() : null,
      meeting_point: meetingPoint?.trim() ? meetingPoint.trim() : null,
      weekday,
      start_time: time,
      duration_minutes: durationMinutes,
      capacity,
      requires_min_capacity: Boolean(requiresMinCapacity),
      is_active: true,
    })
    .select("id")
    .single();

  if (seriesError || !series) {
    redirect(`/${schoolSlug}/admin?err=${encodeURIComponent("No se pudo crear la salida semanal.")}`);
  }

  const occurrences = nextOccurrences({ weekday, time, durationMinutes, weeks: 8 });

  if (occurrences.length > 0) {
    const rows = occurrences.map((o) => ({
      school_id: school.id,
      series_id: series.id,
      title: title.trim(),
      description: description?.trim() ? description.trim() : null,
      meeting_point: meetingPoint?.trim() ? meetingPoint.trim() : null,
      starts_at: o.startsAt.toISOString(),
      ends_at: o.endsAt.toISOString(),
      capacity,
      requires_min_capacity: Boolean(requiresMinCapacity),
      is_visible: false,
      status: "scheduled" as const,
    }));

    const { error: occError } = await supabase.from("events").insert(rows);

    if (occError) {
      redirect(`/${schoolSlug}/admin?err=${encodeURIComponent("Plantilla creada, pero no se pudieron generar ocurrencias.")}`);
    }
  }

  redirect(`/${schoolSlug}/admin?ok=${encodeURIComponent("Salida semanal creada.")}`);
}
