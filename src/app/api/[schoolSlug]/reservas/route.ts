import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSchoolBySlug } from "@/lib/data/schools";
import { normalizePhoneToE164Spain } from "@/lib/utils/phone";

const BodySchema = z.object({
  tripId: z.string().uuid(),
  participantName: z.string().min(2).max(80),
  participantPhone: z.string().min(6).max(32),
  hasPlusOne: z.boolean().optional().default(false),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ schoolSlug: string }> }
) {
  const { schoolSlug } = await ctx.params;

  const bodyJson = await req.json().catch(() => null);
  const body = BodySchema.safeParse(bodyJson);
  if (!body.success) {
    return NextResponse.json(
      { error: "Revisa los datos e inténtalo de nuevo." },
      { status: 400 }
    );
  }

  const phoneE164 = normalizePhoneToE164Spain(body.data.participantPhone);
  if (!phoneE164) {
    return NextResponse.json(
      { error: "Escribe un teléfono válido." },
      { status: 400 }
    );
  }

  const school = await getSchoolBySlug(schoolSlug);
  if (!school) {
    return NextResponse.json({ error: "Escuela no encontrada." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();

  // Trip must be visible and belong to the school
  const { data: trip, error: tripError } = await supabase
    .from("events")
    .select("id, school_id, capacity, is_visible, status")
    .eq("id", body.data.tripId)
    .eq("school_id", school.id)
    .maybeSingle();

  if (tripError) {
    return NextResponse.json({ error: "No se pudo comprobar la salida." }, { status: 500 });
  }

  if (!trip || trip.is_visible !== true) {
    return NextResponse.json(
      { error: "Esta salida no está disponible." },
      { status: 404 }
    );
  }

  if (trip.status !== "scheduled") {
    return NextResponse.json(
      {
        error:
          trip.status === "cancelled"
            ? "Esta salida está cancelada."
            : "Las inscripciones para esta salida están cerradas.",
      },
      { status: 409 }
    );
  }

  // Determine if contact is frequent
  const { data: existingContact, error: contactError } = await supabase
    .from("contacts")
    .select("id, reservations_count, is_frequent_override")
    .eq("school_id", school.id)
    .eq("phone_e164", phoneE164)
    .maybeSingle();

  if (contactError) {
    return NextResponse.json({ error: "No se pudo comprobar el contacto." }, { status: 500 });
  }

  const isFrequent =
    Boolean(existingContact?.is_frequent_override) ||
    (existingContact?.reservations_count ?? 0) >= 2;

  if (body.data.hasPlusOne && !isFrequent) {
    return NextResponse.json(
      { error: "El acompañante (+1) solo está disponible para contactos frecuentes." },
      { status: 400 }
    );
  }

  // Capacity check
  const { data: reservations, error: resError } = await supabase
    .from("reservations")
    .select("has_plus_one")
    .eq("school_id", school.id)
    .eq("event_id", trip.id)
    .eq("status", "confirmed");

  if (resError) {
    return NextResponse.json({ error: "No se pudo comprobar el aforo." }, { status: 500 });
  }

  const occupied = (reservations ?? []).reduce(
    (sum, r) => sum + 1 + (r.has_plus_one ? 1 : 0),
    0
  );

  const needed = body.data.hasPlusOne ? 2 : 1;
  const willBePending = occupied + needed > trip.capacity;

  // Upsert contact (create if needed)
  let contactId = existingContact?.id ?? null;

  if (!contactId) {
    const { data: inserted, error: insertContactError } = await supabase
      .from("contacts")
      .insert({
        school_id: school.id,
        phone_e164: phoneE164,
        full_name: body.data.participantName.trim(),
        reservations_count: 0,
      })
      .select("id")
      .single();

    if (insertContactError) {
      return NextResponse.json({ error: "No se pudo crear el contacto." }, { status: 500 });
    }

    contactId = inserted.id;
  } else {
    // Keep name updated to latest provided (simple MVP approach)
    await supabase
      .from("contacts")
      .update({ full_name: body.data.participantName.trim() })
      .eq("id", contactId);
  }

  // Insert booking
  const { data: booking, error: bookingError } = await supabase
    .from("reservations")
    .insert({
      school_id: school.id,
      event_id: trip.id,
      contact_id: contactId,
      participant_name: body.data.participantName.trim(),
      participant_phone_e164: phoneE164,
      has_plus_one: Boolean(body.data.hasPlusOne),
      status: willBePending ? "pending" : "confirmed",
    })
    .select("id, status")
    .single();

  if (bookingError) {
    // Unique(event_id, contact_id) -> already booked
    const pgCode =
      typeof bookingError === "object" && bookingError !== null && "code" in bookingError
        ? String((bookingError as { code?: unknown }).code)
        : null;

    if (pgCode === "23505") {
      return NextResponse.json(
        { error: "Ya estabas apuntado a esta salida." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "No se pudo completar la reserva." }, { status: 500 });
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

  if (willBePending) {
    try {
      await supabase.from("school_activity").insert({
        school_id: school.id,
        type: "waitlist_joined",
        event_id: trip.id,
        reservation_id: booking.id,
        participant_name: body.data.participantName.trim(),
        participant_phone_e164: phoneE164,
        payload: {
          has_plus_one: Boolean(body.data.hasPlusOne),
        },
      });
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ bookingId: booking.id, status: booking.status }, { status: 201 });
}
