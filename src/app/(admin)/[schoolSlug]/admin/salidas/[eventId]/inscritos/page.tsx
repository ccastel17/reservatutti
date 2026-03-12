import { notFound } from "next/navigation";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import { cancelTrip, closeTrip, reopenTrip } from "./actions";

type Props = {
  params: Promise<{ schoolSlug: string; eventId: string }>;
};

export default async function TripBookingsPage({ params }: Props) {
  const { schoolSlug, eventId } = await params;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/inscritos`,
  });

  const supabase = await getSupabaseServer();

  const { data: trip, error: tripError } = await supabase
    .from("events")
    .select("id, title, starts_at, capacity, is_visible, status")
    .eq("id", eventId)
    .eq("school_id", school.id)
    .maybeSingle();

  if (tripError) throw new Error(tripError.message);
  if (!trip) notFound();

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(
      "id, status, participant_name, participant_phone_e164, has_plus_one, created_at, contacts ( id, full_name, phone_e164, reservations_count )"
    )
    .eq("school_id", school.id)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows =
    (reservations ?? []) as Array<{
      id: string;
      status: "confirmed" | "cancelled";
      participant_name: string;
      participant_phone_e164: string;
      has_plus_one: boolean;
      created_at: string;
      contacts: {
        id: string;
        full_name: string;
        phone_e164: string;
        reservations_count: number;
      } | null;
    }>;

  const confirmedPeople = rows
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + 1 + (r.has_plus_one ? 1 : 0), 0);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <h1 className="text-xl font-semibold text-slate-900">Inscritos</h1>
      <p className="mt-1 text-sm text-slate-600">
        {trip.title} ·{" "}
        {new Date(trip.starts_at).toLocaleString("es-ES", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      {trip.status !== "scheduled" ? (
        <div
          className={
            trip.status === "cancelled"
              ? "mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              : "mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"
          }
        >
          {trip.status === "cancelled" ? "Salida cancelada (sigue visible públicamente)." : "Inscripciones cerradas."}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {trip.status === "scheduled" ? (
          <>
            <form action={closeTrip}>
              <input type="hidden" name="schoolSlug" value={schoolSlug} />
              <input type="hidden" name="eventId" value={eventId} />
              <button className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                Cerrar inscripciones
              </button>
            </form>
            <form action={cancelTrip}>
              <input type="hidden" name="schoolSlug" value={schoolSlug} />
              <input type="hidden" name="eventId" value={eventId} />
              <button className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white">
                Cancelar salida
              </button>
            </form>
          </>
        ) : (
          <form action={reopenTrip} className="col-span-2">
            <input type="hidden" name="schoolSlug" value={schoolSlug} />
            <input type="hidden" name="eventId" value={eventId} />
            <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              Reabrir salida
            </button>
          </form>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-medium text-slate-900">
          {confirmedPeople} / {trip.capacity} plazas ocupadas
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-600">Aún no hay nadie apuntado.</p>
        ) : (
          rows.map((r) => {
            const contact = r.contacts;
            const frequent = (contact?.reservations_count ?? 0) >= 2;

            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {r.participant_name}{r.has_plus_one ? " (+1)" : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{r.participant_phone_e164}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {frequent ? "Contacto frecuente" : "Contacto nuevo"}
                      {contact ? ` · ${contact.reservations_count} reservas` : ""}
                    </p>
                  </div>
                  <span
                    className={
                      r.status === "confirmed"
                        ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-900"
                        : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                    }
                  >
                    {r.status === "confirmed" ? "Confirmada" : "Cancelada"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
