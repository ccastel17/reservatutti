"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";

const Schema = z.object({
  schoolSlug: z.string().min(1),
  eventId: z.string().uuid(),
});

const UpdateCapacitySchema = Schema.extend({
  capacity: z.coerce.number().int().min(1).max(200),
});

const CancelReservationSchema = Schema.extend({
  reservationId: z.string().uuid(),
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

export async function updateCapacity(formData: FormData) {
  const parsed = UpdateCapacitySchema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    eventId: formData.get("eventId"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) redirect("/");

  const { schoolSlug, eventId, capacity } = parsed.data;
  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/inscritos`,
  });

  const supabase = await getSupabaseServer();

  const { data: reservations, error: resError } = await supabase
    .from("reservations")
    .select("has_plus_one")
    .eq("school_id", school.id)
    .eq("event_id", eventId)
    .eq("status", "confirmed");

  if (resError) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No se pudo comprobar el aforo actual."
      )}`
    );
  }

  const occupied = (reservations ?? []).reduce(
    (sum, r) => sum + 1 + (r.has_plus_one ? 1 : 0),
    0
  );

  if (capacity < occupied) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        `No puedes poner ${capacity} plazas porque ya hay ${occupied} ocupadas.`
      )}`
    );
  }

  const { error } = await supabase
    .from("events")
    .update({ capacity })
    .eq("id", eventId)
    .eq("school_id", school.id);

  if (error) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No se pudo actualizar la capacidad."
      )}`
    );
  }

  redirect(
    `/${schoolSlug}/admin/salidas/${eventId}/inscritos?ok=${encodeURIComponent(
      "Capacidad actualizada."
    )}`
  );
}

export async function cancelReservation(formData: FormData) {
  const parsed = CancelReservationSchema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    eventId: formData.get("eventId"),
    reservationId: formData.get("reservationId"),
  });
  if (!parsed.success) redirect("/");

  const { schoolSlug, eventId, reservationId } = parsed.data;
  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/inscritos`,
  });

  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", reservationId)
    .eq("school_id", school.id)
    .eq("event_id", eventId);

  if (error) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No se pudo eliminar al inscrito."
      )}`
    );
  }

  redirect(
    `/${schoolSlug}/admin/salidas/${eventId}/inscritos?ok=${encodeURIComponent(
      "Inscripción eliminada."
    )}`
  );
}
