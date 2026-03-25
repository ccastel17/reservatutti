import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import { CopyToClipboardOnLoad } from "@/components/admin/CopyToClipboardOnLoad";
import { ShareTripButtons } from "@/components/admin/ShareTripButtons";
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
  searchParams: Promise<{ ok?: string; err?: string; share?: string }>;
};

export default async function TripBookingsPage({ params, searchParams }: Props) {
  const { schoolSlug, eventId } = await params;
  const sp = await searchParams;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const publicUrl = new URL(`/${schoolSlug}/salidas/${eventId}`, baseUrl).toString();
  const shareUrl = sp.share ? new URL(sp.share, baseUrl).toString() : null;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/inscritos`,
  });

  const supabase = await getSupabaseServer();

  const { data: trip, error: tripError } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at, capacity, requires_min_capacity, is_visible, status, meeting_point, description, category")
    .eq("id", eventId)
    .eq("school_id", school.id)
    .maybeSingle();

  if (tripError) throw new Error(tripError.message);
  if (!trip) notFound();

  const catLabel = trip.category === "theory" ? "Teórica" : trip.category === "practice" ? "Práctica" : "Salida";

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
      status: "confirmed" | "pending" | "cancelled";
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

  const oneLine = (trip.description ?? "")
    .split("\n")
    .map((s) => s.trim())
    .find(Boolean);

  const dateText = new Date(trip.starts_at).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const startTime = new Date(trip.starts_at).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endTime = trip.ends_at
    ? new Date(trip.ends_at).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const timeText = endTime ? `${startTime}–${endTime}` : startTime;

  const shareMessage = [
    publicUrl,
    "",
    `${catLabel}: ${trip.title}`,
    `Fecha: ${dateText}`,
    `Horario: ${timeText}`,
    `Cupos: ${confirmedPeople}/${trip.capacity}`,
    oneLine ? `\n${oneLine}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  const confirmedRows = rows.filter((r) => r.status === "confirmed");
  const pendingRows = rows.filter((r) => r.status === "pending");

  const whenFull = new Date(trip.starts_at).toLocaleString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusBadge =
    trip.status === "cancelled"
      ? { label: "Cancelada", className: "bg-coral/15 text-coral" }
      : trip.status === "closed"
        ? { label: "Cerrada", className: "bg-surface-2 text-muted" }
        : null;

  const minCapacityBadge =
    trip.status === "scheduled" && trip.requires_min_capacity
      ? confirmedPeople >= trip.capacity
        ? { label: "Confirmada", className: "bg-brand-50 text-brand-700" }
        : { label: "Sin confirmar", className: "bg-amber-50 text-amber-800" }
      : null;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      {shareUrl ? <CopyToClipboardOnLoad text={shareUrl} /> : null}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-sea">Inscritos</h1>
        <ShareTripButtons publicUrl={publicUrl} whatsappHref={whatsappHref} />
      </div>
      <section className="mt-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{catLabel}</p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <p className="text-2xl font-semibold tracking-tight text-sea">{trip.title}</p>
              <div className="flex flex-col items-end gap-1">
                {statusBadge ? (
                  <span className={`mt-0.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                ) : null}
                {minCapacityBadge ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${minCapacityBadge.className}`}>
                    {minCapacityBadge.label}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {whenFull}
              </span>
              <span className="inline-flex items-center rounded-full bg-sea-50 px-2.5 py-1 text-xs font-semibold text-sea">
                {confirmedPeople} / {trip.capacity} plazas
              </span>
            </div>
          </div>

          <Link
            href={`/${schoolSlug}/admin/salidas/${eventId}/editar`}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
          >
            Editar
          </Link>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {trip.meeting_point ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Punto de encuentro</p>
              <p className="mt-0.5 text-sm text-sea">{trip.meeting_point}</p>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Plazas</p>
            <p className="mt-0.5 text-sm text-sea">{confirmedPeople} / {trip.capacity} ocupadas</p>
          </div>
        </div>

        {trip.description ? (
          <div className="mt-4 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Detalles</p>
            <p className="mt-2 text-sm text-muted whitespace-pre-wrap">{trip.description}</p>
          </div>
        ) : null}
      </section>

      {sp.ok ? (
        <div className="mt-4 rounded-xl border border-brand/30 bg-brand-50 p-3 text-sm text-brand-700">
          {sp.ok}
        </div>
      ) : null}
      {sp.err ? (
        <div className="mt-4 rounded-xl border border-coral/30 bg-coral/10 p-3 text-sm text-coral">
          {sp.err}
        </div>
      ) : null}

      <details className="group mt-4 rounded-2xl border border-border bg-surface shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-4">
          <div>
            <h2 className="text-sm font-semibold text-sea">Añadir inscrito (manual)</h2>
            <p className="mt-1 text-xs text-muted">Esto crea una reserva confirmada desde el panel.</p>
          </div>

          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-sea">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5 transition-transform group-open:rotate-180"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </summary>

        <div className="px-4 pb-4">
          <form action={addManualReservation} className="space-y-3">
            <input type="hidden" name="schoolSlug" value={schoolSlug} />
            <input type="hidden" name="eventId" value={eventId} />

            <div>
              <label className="block text-xs font-medium text-muted">Nombre y Apellido/s</label>
              <input
                name="participantName"
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-sea placeholder:text-muted outline-none focus:border-brand"
                placeholder="Ej. Marta López"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted">Teléfono</label>
              <input
                name="participantPhone"
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-sea placeholder:text-muted outline-none focus:border-brand"
                placeholder="Ej. 600 111 222"
                inputMode="tel"
                required
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-3">
              <input type="checkbox" name="hasPlusOne" className="mt-1 h-4 w-4" />
              <div>
                <p className="text-sm font-semibold text-sea">Añadir +1</p>
                <p className="text-xs text-muted">
                  Solo para contactos frecuentes (o marcados como frecuentes).
                </p>
              </div>
            </label>

            <button className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm">
              Añadir
            </button>
          </form>
        </div>
      </details>

      {trip.status !== "scheduled" ? (
        <div
          className={
            trip.status === "cancelled"
              ? "mt-4 rounded-2xl border border-coral/30 bg-coral/10 p-4"
              : "mt-4 rounded-2xl border border-border bg-surface-2 p-4"
          }
        >
          <p className="text-sm font-semibold text-sea">Aviso</p>
          <p className="mt-1 text-sm text-muted">
            {trip.status === "cancelled" ? "Salida cancelada (sigue visible públicamente)." : "Inscripciones cerradas."}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {trip.status === "scheduled" ? (
          <>
            <form action={closeTrip}>
              <input type="hidden" name="schoolSlug" value={schoolSlug} />
              <input type="hidden" name="eventId" value={eventId} />
              <button className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-sea shadow-sm">
                Cerrar inscripciones
              </button>
            </form>
            <form action={cancelTrip}>
              <input type="hidden" name="schoolSlug" value={schoolSlug} />
              <input type="hidden" name="eventId" value={eventId} />
              <button className="w-full rounded-xl bg-coral px-4 py-3 text-sm font-semibold text-white shadow-sm">
                Cancelar salida
              </button>
            </form>
          </>
        ) : (
          <form action={reopenTrip} className="col-span-2">
            <input type="hidden" name="schoolSlug" value={schoolSlug} />
            <input type="hidden" name="eventId" value={eventId} />
            <button className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm">
              Reabrir salida
            </button>
          </form>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-sea">
              {confirmedPeople} / {trip.capacity} plazas ocupadas
            </p>
            <p className="mt-1 text-xs text-muted">Ordenados por orden de inscripción.</p>
          </div>

          <form action={updateCapacity} className="flex items-end gap-2">
            <input type="hidden" name="schoolSlug" value={schoolSlug} />
            <input type="hidden" name="eventId" value={eventId} />
            <div>
              <label className="block text-xs font-medium text-muted">Plazas</label>
              <input
                type="number"
                name="capacity"
                defaultValue={trip.capacity}
                min={confirmedPeople}
                max={200}
                className="mt-1 w-24 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-sea outline-none focus:border-brand"
                required
              />
            </div>
            <button className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm">
              Guardar
            </button>
          </form>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay nadie apuntado.</p>
        ) : (
          <>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm font-semibold text-sea">Confirmados</p>
              <span className="rounded-full bg-sea-50 px-2.5 py-1 text-xs font-semibold text-sea">
                {confirmedRows.length}
              </span>
            </div>
            {confirmedRows.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-sm text-muted">No hay confirmados.</p>
              </div>
            ) : (
              confirmedRows.map((r, idx) => {
                const contact = r.contacts;
                const frequent =
                  Boolean(contact?.is_frequent_override) || (contact?.reservations_count ?? 0) >= 2;
                const waTo = r.participant_phone_e164.replace(/\D/g, "");
                const waLink = waTo ? `https://wa.me/${waTo}` : null;

                return (
                  <div key={r.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-sea">
                          {idx + 1}. {r.participant_name}
                          {r.has_plus_one ? " (+1)" : ""}
                        </p>
                        <p className="mt-1 text-sm text-muted">{r.participant_phone_e164}</p>
                        <p className="mt-2 text-xs text-muted">
                          {frequent ? "Contacto frecuente" : "Contacto nuevo"}
                          {contact ? ` · ${contact.reservations_count} reservas` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(r.created_at).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {waLink ? (
                          <Link
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
                          >
                            WhatsApp
                          </Link>
                        ) : null}

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
                            <button className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm">
                              {contact.is_frequent_override ? "Quitar frecuente" : "Marcar frecuente"}
                            </button>
                          </form>
                        ) : null}

                        <form action={cancelReservation}>
                          <input type="hidden" name="schoolSlug" value={schoolSlug} />
                          <input type="hidden" name="eventId" value={eventId} />
                          <input type="hidden" name="reservationId" value={r.id} />
                          <button className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm">
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-sea">Pendientes</p>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {pendingRows.length}
              </span>
            </div>
            {pendingRows.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-sm text-muted">No hay pendientes.</p>
              </div>
            ) : (
              pendingRows.map((r, idx) => {
                const contact = r.contacts;
                const frequent =
                  Boolean(contact?.is_frequent_override) || (contact?.reservations_count ?? 0) >= 2;
                const waTo = r.participant_phone_e164.replace(/\D/g, "");
                const waLink = waTo ? `https://wa.me/${waTo}` : null;

                return (
                  <div key={r.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-sea">
                            {idx + 1}. {r.participant_name}
                            {r.has_plus_one ? " (+1)" : ""}
                          </p>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            Pendiente
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted">{r.participant_phone_e164}</p>
                        <p className="mt-2 text-xs text-muted">
                          {frequent ? "Contacto frecuente" : "Contacto nuevo"}
                          {contact ? ` · ${contact.reservations_count} reservas` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(r.created_at).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {waLink ? (
                          <Link
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
                          >
                            WhatsApp
                          </Link>
                        ) : null}

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
                            <button className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm">
                              {contact.is_frequent_override ? "Quitar frecuente" : "Marcar frecuente"}
                            </button>
                          </form>
                        ) : null}

                        <form action={cancelReservation}>
                          <input type="hidden" name="schoolSlug" value={schoolSlug} />
                          <input type="hidden" name="eventId" value={eventId} />
                          <input type="hidden" name="reservationId" value={r.id} />
                          <button className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm">
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {pendingRows.length > 0 ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-sea">Crear salida nueva con los usuarios en lista de espera</p>
                <p className="mt-1 text-sm text-amber-800">
                  Hay {pendingRows.length} personas pendientes para {trip.capacity} plazas.
                </p>
                <Link
                  href={`/${schoolSlug}/admin/salidas/${eventId}/duplicar`}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm"
                >
                  Crear nueva salida
                </Link>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
