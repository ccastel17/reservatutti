import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import { confirmDuplicateTrip } from "./actions";

type Props = {
  params: Promise<{ schoolSlug: string; eventId: string }>;
  searchParams: Promise<{ err?: string }>;
};

export default async function DuplicateTripPage({ params, searchParams }: Props) {
  const { schoolSlug, eventId } = await params;
  const sp = await searchParams;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/duplicar`,
  });

  const supabase = await getSupabaseServer();
  const { data: trip, error } = await supabase
    .from("events")
    .select(
      "id, title, description, meeting_point, starts_at, ends_at, capacity, status, is_visible, category"
    )
    .eq("id", eventId)
    .eq("school_id", school.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!trip) notFound();

  const { data: pendingReservations, error: pendingError } = await supabase
    .from("reservations")
    .select("id")
    .eq("school_id", school.id)
    .eq("event_id", eventId)
    .eq("status", "pending");

  if (pendingError) throw new Error(pendingError.message);

  const pendingCount = pendingReservations?.length ?? 0;

  const startsAt = new Date(trip.starts_at);
  const endsAt = new Date(trip.ends_at);
  const durationMs = endsAt.getTime() - startsAt.getTime();
  const durationHours = Math.max(0.5, Math.round((durationMs / (60 * 60 * 1000)) * 4) / 4);

  const pad2 = (v: number) => String(v).padStart(2, "0");
  const dateDefault = `${startsAt.getFullYear()}-${pad2(startsAt.getMonth() + 1)}-${pad2(startsAt.getDate())}`;
  const timeDefault = `${pad2(startsAt.getHours())}:${pad2(startsAt.getMinutes())}`;

  const catLabel =
    trip.category === "theory" ? "Teórica" : trip.category === "practice" ? "Práctica" : "Salida";

  const willMoveCount = Math.min(trip.capacity, pendingCount);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{catLabel}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-sea">Duplicar evento</h1>
        </div>
        <Link
          href={`/${schoolSlug}/admin/salidas/${eventId}/inscritos`}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
        >
          Volver
        </Link>
      </div>

      {sp.err ? (
        <div className="mt-4 rounded-xl border border-coral/30 bg-coral/10 p-3 text-sm text-coral">{sp.err}</div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-sea">Crear salida nueva con los usuarios en lista de espera</p>
        <p className="mt-1 text-sm text-amber-800">
          Al confirmar, se creará un duplicado y se moverán {willMoveCount} personas (las primeras por orden de
          inscripción) de <span className="font-semibold">pendientes</span> a <span className="font-semibold">confirmados</span> en la nueva salida.
        </p>
      </div>

      <form action={confirmDuplicateTrip} className="mt-4 space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <input type="hidden" name="schoolSlug" value={schoolSlug} />
        <input type="hidden" name="eventId" value={eventId} />

        <div>
          <label className="block text-sm font-medium text-sea">Tipo</label>
          <select
            name="category"
            defaultValue={trip.category}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base font-semibold text-sea outline-none focus:border-brand"
          >
            <option value="trip">Salidas</option>
            <option value="theory">Teóricas</option>
            <option value="practice">Prácticas</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-sea">Título</label>
          <input
            name="title"
            defaultValue={`${trip.title} (2)`}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-sea">Fecha</label>
            <input
              type="date"
              name="date"
              defaultValue={dateDefault}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea outline-none focus:border-brand"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sea">Hora</label>
            <input
              type="time"
              name="time"
              defaultValue={timeDefault}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea outline-none focus:border-brand"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-sea">Duración (h)</label>
            <input
              type="number"
              name="durationHours"
              defaultValue={durationHours}
              min={0.5}
              max={168}
              step={0.25}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea outline-none focus:border-brand"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sea">Plazas</label>
            <input
              type="number"
              name="capacity"
              defaultValue={trip.capacity}
              min={1}
              max={200}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea outline-none focus:border-brand"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-sea">Punto de encuentro (opcional)</label>
          <input
            name="meetingPoint"
            defaultValue={trip.meeting_point ?? ""}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-sea">Detalles (opcional)</label>
          <textarea
            name="description"
            defaultValue={trip.description ?? ""}
            rows={4}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
          />
        </div>

        <button className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-sm">
          Confirmar y crear duplicado
        </button>
      </form>
    </main>
  );
}
