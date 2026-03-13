import { notFound } from "next/navigation";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  addManualReservation,
  cancelReservation,
  cancelTrip,
  closeTrip,
  reopenTrip,
  toggleContactFrequent,
  updateCapacity,
} from "./actions";

type Props = {
  params: Promise<{ schoolSlug: string; eventId: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
};

export default async function TripBookingsPage({ params, searchParams }: Props) {
  const { schoolSlug, eventId } = await params;
  const sp = await searchParams;

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
      "id, status, participant_name, participant_phone_e164, has_plus_one, created_at, contacts ( id, full_name, phone_e164, reservations_count, is_frequent_override )"
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
        is_frequent_override: boolean;
      } | null;
    }>;

  const confirmedPeople = rows
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + 1 + (r.has_plus_one ? 1 : 0), 0);

  const confirmedRows = rows.filter((r) => r.status === "confirmed");

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

      {sp.ok ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {sp.ok}
        </div>
      ) : null}
      {sp.err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {sp.err}
        </div>
      ) : null}

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Añadir inscrito (manual)</h2>
        <p className="mt-1 text-xs text-slate-500">Esto crea una reserva confirmada desde el panel.</p>

        <form action={addManualReservation} className="mt-4 space-y-3">
          <input type="hidden" name="schoolSlug" value={schoolSlug} />
          <input type="hidden" name="eventId" value={eventId} />

          <div>
            <label className="block text-xs font-medium text-slate-600">Nombre</label>
            <input
              name="participantName"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
              placeholder="Ej. Marta"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">Teléfono</label>
            <input
              name="participantPhone"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
              placeholder="Ej. 600 111 222"
              inputMode="tel"
              required
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <input type="checkbox" name="hasPlusOne" className="mt-1 h-4 w-4" />
            <div>
              <p className="text-sm font-medium text-slate-900">Añadir +1</p>
              <p className="text-xs text-slate-600">Solo para contactos frecuentes (o marcados como frecuentes).</p>
            </div>
          </label>

          <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Añadir
          </button>
        </form>
      </section>

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {confirmedPeople} / {trip.capacity} plazas ocupadas
            </p>
            <p className="mt-1 text-xs text-slate-500">Ordenados por orden de inscripción.</p>
          </div>

          <form action={updateCapacity} className="flex items-end gap-2">
            <input type="hidden" name="schoolSlug" value={schoolSlug} />
            <input type="hidden" name="eventId" value={eventId} />
            <div>
              <label className="block text-xs font-medium text-slate-600">Plazas</label>
              <input
                type="number"
                name="capacity"
                defaultValue={trip.capacity}
                min={confirmedPeople}
                max={200}
                className="mt-1 w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                required
              />
            </div>
            <button className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Guardar
            </button>
          </form>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-600">Aún no hay nadie apuntado.</p>
        ) : (
          confirmedRows.map((r, idx) => {
            const contact = r.contacts;
            const frequent =
              Boolean(contact?.is_frequent_override) || (contact?.reservations_count ?? 0) >= 2;

            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {idx + 1}. {r.participant_name}
                      {r.has_plus_one ? " (+1)" : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{r.participant_phone_e164}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {frequent ? "Contacto frecuente" : "Contacto nuevo"}
                      {contact ? ` · ${contact.reservations_count} reservas` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-900">
                      Confirmada
                    </span>

                    {contact ? (
                      <form action={toggleContactFrequent}>
                        <input type="hidden" name="schoolSlug" value={schoolSlug} />
                        <input type="hidden" name="eventId" value={eventId} />
                        <input type="hidden" name="contactId" value={contact.id} />
                        <input
                          type="hidden"
                          name="isFrequentOverride"
                          value={contact.is_frequent_override ? "false" : "true"}
                        />
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900">
                          {contact.is_frequent_override ? "Quitar frecuente" : "Marcar frecuente"}
                        </button>
                      </form>
                    ) : null}

                    <form action={cancelReservation}>
                      <input type="hidden" name="schoolSlug" value={schoolSlug} />
                      <input type="hidden" name="eventId" value={eventId} />
                      <input type="hidden" name="reservationId" value={r.id} />
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
