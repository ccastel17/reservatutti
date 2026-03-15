import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  getBookingsByWeekday,
  getTopContacts,
  getTripOccupancyStats,
} from "@/lib/data/stats";

const weekdayLabelsEs = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

type Props = {
  params: Promise<{ schoolSlug: string }>;
};

export default async function AdminStatsPage({ params }: Props) {
  const { schoolSlug } = await params;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/stats`,
  });

  const supabase = await getSupabaseServer();

  const [occupancy, topContacts, byWeekday] = await Promise.all([
    getTripOccupancyStats(supabase, school.id),
    getTopContacts(supabase, school.id),
    getBookingsByWeekday(supabase, school.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Panel</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight text-sea">Stats</h1>
        <p className="mt-2 text-base text-muted">{school.name}</p>
      </div>

      <section className="mt-6">
        <h2 className="text-base font-semibold text-sea">Ocupación de salidas (último mes)</h2>
        <div className="mt-3 border-b border-border" />

        <div className="mt-3">
          <div className="grid grid-cols-[1fr_auto] items-end gap-4 px-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Salida</p>
            <p className="text-right text-xs font-medium uppercase tracking-wide text-muted">Ocupación</p>
          </div>

          <div className="mt-2 space-y-3">
            {occupancy.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay datos suficientes.</p>
            ) : (
              occupancy.map((row) => (
                <div key={row.key} className="grid grid-cols-[1fr_auto] gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-sea">{row.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {row.occupied} / {row.capacity} plazas ocupadas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight text-brand-700">
                      {row.occupancyPct}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-sea">Clientes más activos</h2>
        <div className="mt-3 border-b border-border" />

        <div className="mt-3">
          <div className="grid grid-cols-[1fr_auto] items-end gap-4 px-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Cliente</p>
            <p className="text-right text-xs font-medium uppercase tracking-wide text-muted">Salidas</p>
          </div>

          <div className="mt-2 space-y-3">
            {topContacts.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay clientes con reservas.</p>
            ) : (
              topContacts.map((c) => (
                <div key={c.id} className="grid grid-cols-[1fr_auto] gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-sea">{c.full_name}</p>
                    <p className="mt-1 text-sm text-muted">{c.phone_e164}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight text-brand-700">
                      {c.reservations_count}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-sea">Demanda por día de la semana</h2>
        <div className="mt-3 border-b border-border" />

        <div className="mt-3">
          <div className="grid grid-cols-[1fr_auto] items-end gap-4 px-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Día</p>
            <p className="text-right text-xs font-medium uppercase tracking-wide text-muted">Reservas</p>
          </div>

          <div className="mt-2 space-y-3">
            {byWeekday.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay salidas en el último mes.</p>
            ) : (
              byWeekday.map((r) => (
                <div key={r.weekday} className="grid grid-cols-[1fr_auto] gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-sea">{weekdayLabelsEs[r.weekday] ?? ""}</p>
                    <p className="mt-1 text-sm text-muted">{r.trips} salidas publicadas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight text-brand-700">{r.occupied}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
