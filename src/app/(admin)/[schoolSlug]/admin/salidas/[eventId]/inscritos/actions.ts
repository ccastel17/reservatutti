"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { normalizePhoneToE164Spain } from "@/lib/utils/phone";

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

const ToggleFrequentSchema = Schema.extend({
  contactId: z.string().uuid(),
  isFrequentOverride: z.coerce.boolean(),
});

const ManualAddSchema = Schema.extend({
  participantName: z.string().min(2).max(80),
  participantPhone: z.string().min(6).max(32),
  hasPlusOne: z.coerce.boolean().optional().default(false),
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

  const { data: existing, error: existingError } = await supabase
    .from("reservations")
    .select("id, status")
    .eq("id", reservationId)
    .eq("school_id", school.id)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingError || !existing) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No se pudo encontrar la reserva."
      )}`
    );
  }

  const isConfirmed = existing.status === "confirmed";

  if (isConfirmed) {
    const rpcClient = supabase as unknown as {
      rpc: (
        fn: string,
        args: {
          p_school_id: string;
          p_event_id: string;
          p_reservation_id: string;
        }
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    };

    const { data: rpcData, error: rpcError } = await rpcClient.rpc(
      "cancel_reservation_and_promote_waitlist",
      {
        p_school_id: school.id,
        p_event_id: eventId,
        p_reservation_id: reservationId,
      }
    );

    if (rpcError) {
      redirect(
        `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
          "No se pudo eliminar al inscrito."
        )}`
      );
    }

    const promotedId = (() => {
      if (!Array.isArray(rpcData) || rpcData.length === 0) return null;
      const first: unknown = rpcData[0];
      if (typeof first !== "object" || first === null) return null;
      if (!("promoted_reservation_id" in first)) return null;
      const value = (first as { promoted_reservation_id?: unknown }).promoted_reservation_id;
      return typeof value === "string" ? value : null;
    })();

    if (promotedId) {
      try {
        const { data: promoted } = await supabase
          .from("reservations")
          .select("id, participant_name, participant_phone_e164, event_id")
          .eq("id", promotedId)
          .eq("school_id", school.id)
          .maybeSingle();

        await supabase.from("school_activity").insert({
          school_id: school.id,
          type: "waitlist_promoted",
          event_id: promoted?.event_id ?? eventId,
          reservation_id: promoted?.id ?? promotedId,
          participant_name: promoted?.participant_name ?? null,
          participant_phone_e164: promoted?.participant_phone_e164 ?? null,
          payload: {
            cancelled_reservation_id: reservationId,
          },
        });
      } catch {
        // ignore
      }
    }

    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?ok=${encodeURIComponent(
        promotedId
          ? "Inscripción eliminada. Se ha promovido a una persona de la lista de espera."
          : "Inscripción eliminada."
      )}`
    );
  }

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

export async function toggleContactFrequent(formData: FormData) {
  const parsed = ToggleFrequentSchema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    eventId: formData.get("eventId"),
    contactId: formData.get("contactId"),
    isFrequentOverride: formData.get("isFrequentOverride"),
  });
  if (!parsed.success) redirect("/");

  const { schoolSlug, eventId, contactId, isFrequentOverride } = parsed.data;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/inscritos`,
  });

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("contacts")
    .update({ is_frequent_override: isFrequentOverride })
    .eq("id", contactId)
    .eq("school_id", school.id);

  if (error) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No se pudo actualizar el contacto."
      )}`
    );
  }

  redirect(
    `/${schoolSlug}/admin/salidas/${eventId}/inscritos?ok=${encodeURIComponent(
      isFrequentOverride ? "Contacto marcado como frecuente." : "Contacto desmarcado como frecuente."
    )}`
  );
}

export async function addManualReservation(formData: FormData) {
  const parsed = ManualAddSchema.safeParse({
    schoolSlug: formData.get("schoolSlug"),
    eventId: formData.get("eventId"),
    participantName: formData.get("participantName"),
    participantPhone: formData.get("participantPhone"),
    hasPlusOne: formData.get("hasPlusOne"),
  });
  if (!parsed.success) redirect("/");

  const { schoolSlug, eventId, participantName, participantPhone } = parsed.data;
  const hasPlusOne = Boolean(parsed.data.hasPlusOne);

  const phoneE164 = normalizePhoneToE164Spain(participantPhone);
  if (!phoneE164) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "Escribe un teléfono válido."
      )}`
    );
  }

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/inscritos`,
  });

  const supabase = await getSupabaseServer();

  const { data: trip, error: tripError } = await supabase
    .from("events")
    .select("id, capacity, status")
    .eq("id", eventId)
    .eq("school_id", school.id)
    .maybeSingle();

  if (tripError || !trip) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No se pudo comprobar la salida."
      )}`
    );
  }

  if (trip.status !== "scheduled") {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No puedes apuntar a nadie porque la salida no está en estado programado."
      )}`
    );
  }

  const { data: reservations, error: resError } = await supabase
    .from("reservations")
    .select("has_plus_one")
    .eq("school_id", school.id)
    .eq("event_id", eventId)
    .eq("status", "confirmed");

  if (resError) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No se pudo comprobar el aforo."
      )}`
    );
  }

  const occupied = (reservations ?? []).reduce(
    (sum, r) => sum + 1 + (r.has_plus_one ? 1 : 0),
    0
  );

  const needed = hasPlusOne ? 2 : 1;
  const willBePending = occupied + needed > trip.capacity;

  const { data: existingContact, error: contactError } = await supabase
    .from("contacts")
    .select("id, reservations_count, is_frequent_override")
    .eq("school_id", school.id)
    .eq("phone_e164", phoneE164)
    .maybeSingle();

  if (contactError) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No se pudo comprobar el contacto."
      )}`
    );
  }

  const isFrequent =
    Boolean(existingContact?.is_frequent_override) ||
    (existingContact?.reservations_count ?? 0) >= 2;

  if (hasPlusOne && !isFrequent) {
    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "El +1 solo está disponible para contactos frecuentes (o marcados como frecuentes)."
      )}`
    );
  }

  let contactId = existingContact?.id ?? null;
  if (!contactId) {
    const { data: inserted, error: insertContactError } = await supabase
      .from("contacts")
      .insert({
        school_id: school.id,
        phone_e164: phoneE164,
        full_name: participantName.trim(),
        reservations_count: 0,
      })
      .select("id")
      .single();

    if (insertContactError) {
      redirect(
        `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
          "No se pudo crear el contacto."
        )}`
      );
    }

    contactId = inserted.id;
  } else {
    await supabase
      .from("contacts")
      .update({ full_name: participantName.trim() })
      .eq("id", contactId);
  }

  const { error: bookingError } = await supabase.from("reservations").insert({
    school_id: school.id,
    event_id: eventId,
    contact_id: contactId,
    participant_name: participantName.trim(),
    participant_phone_e164: phoneE164,
    has_plus_one: hasPlusOne,
    status: willBePending ? "pending" : "confirmed",
  });

  if (bookingError) {
    const pgCode =
      typeof bookingError === "object" && bookingError !== null && "code" in bookingError
        ? String((bookingError as { code?: unknown }).code)
        : null;

    if (pgCode === "23505") {
      redirect(
        `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
          "Este teléfono ya está apuntado a esta salida."
        )}`
      );
    }

    redirect(
      `/${schoolSlug}/admin/salidas/${eventId}/inscritos?err=${encodeURIComponent(
        "No se pudo añadir la inscripción."
      )}`
    );
  }

  if (!willBePending) {
    const nowIso = new Date().toISOString();
    await supabase
      .from("contacts")
      .update({
        reservations_count: (existingContact?.reservations_count ?? 0) + 1,
        first_reserved_at: existingContact ? undefined : nowIso,
        last_reserved_at: nowIso,
      })
      .eq("id", contactId);
  }

  redirect(
    `/${schoolSlug}/admin/salidas/${eventId}/inscritos?ok=${encodeURIComponent(
      willBePending ? "Añadido en lista de espera." : "Inscripción añadida."
    )}`
  );
}
