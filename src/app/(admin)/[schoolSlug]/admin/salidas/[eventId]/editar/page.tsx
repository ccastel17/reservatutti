import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import { updateTripTexts } from "./actions";

type Props = {
  params: Promise<{ schoolSlug: string; eventId: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
};

export default async function EditTripTextsPage({ params, searchParams }: Props) {
  const { schoolSlug, eventId } = await params;
  const sp = await searchParams;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/salidas/${eventId}/editar`,
  });

  const supabase = await getSupabaseServer();
  const { data: trip, error } = await supabase
    .from("events")
    .select("id, title, meeting_point, description, starts_at, category")
    .eq("id", eventId)
    .eq("school_id", school.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!trip) notFound();

  const catLabel = trip.category === "theory" ? "Teórica" : trip.category === "practice" ? "Práctica" : "Salida";

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{catLabel}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-sea">Editar textos</h1>
          <p className="mt-1 text-sm text-muted">
            {new Date(trip.starts_at).toLocaleString("es-ES", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <Link
          href={`/${schoolSlug}/admin/salidas/${eventId}/inscritos`}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
        >
          Volver
        </Link>
      </div>

      {sp.ok ? (
        <div className="mt-4 rounded-xl border border-brand/30 bg-brand-50 p-3 text-sm text-brand-700">
          {sp.ok}
        </div>
      ) : null}
      {sp.err ? (
        <div className="mt-4 rounded-xl border border-coral/30 bg-coral/10 p-3 text-sm text-coral">{sp.err}</div>
      ) : null}

      <form action={updateTripTexts} className="mt-4 space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <input type="hidden" name="schoolSlug" value={schoolSlug} />
        <input type="hidden" name="eventId" value={eventId} />

        <div>
          <label className="block text-xs font-medium text-muted">Título</label>
          <input
            name="title"
            defaultValue={trip.title}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-sea placeholder:text-muted outline-none focus:border-brand"
            placeholder="Ej. Ruta de la sal"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted">Punto de encuentro</label>
          <input
            name="meetingPoint"
            defaultValue={trip.meeting_point ?? ""}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-sea placeholder:text-muted outline-none focus:border-brand"
            placeholder="Ej. Port Ginesta"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted">Detalles</label>
          <textarea
            name="description"
            defaultValue={trip.description ?? ""}
            rows={6}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-sea placeholder:text-muted outline-none focus:border-brand"
            placeholder="Ej. Salida para navegantes intrépidos."
          />
        </div>

        <button className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm">Guardar</button>
      </form>

      <p className="mt-3 text-xs text-muted">Solo puedes editar textos. Fechas y horarios no se modifican aquí.</p>
    </main>
  );
}
