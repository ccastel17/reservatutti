import type {
  BookingsByWeekdayRow,
  TopContactRow,
  TripOccupancyStatRow,
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

function formatPercent(pct: number) {
  if (!Number.isFinite(pct)) return "0%";
  return `${pct}%`;
}

type Props = {
  occupancy: TripOccupancyStatRow[];
  topContacts: TopContactRow[];
  byWeekday: BookingsByWeekdayRow[];
};

export function AdminStatsPanel({ occupancy, topContacts, byWeekday }: Props) {
  return (
    <div className="mt-6 space-y-6">
      <section>
        <h2 className="text-base font-semibold text-sea">Ocupación de salidas (último mes)</h2>
        <div className="mt-3 space-y-2">
          {occupancy.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay datos suficientes.</p>
          ) : (
            occupancy.map((row) => (
              <div
                key={row.key}
                className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
              >
                <p className="text-2xl font-semibold tracking-tight text-sea">{row.title}</p>
                <p className="mt-1 text-base font-semibold text-brand-700">
                  {formatPercent(row.occupancyPct)} ocupación
                </p>
                <p className="mt-3 text-sm text-muted">
                  {row.occupied} / {row.capacity} plazas ocupadas
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-sea">Clientes más activos</h2>
        <div className="mt-3 space-y-2">
          {topContacts.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay clientes con reservas.</p>
          ) : (
            topContacts.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
              >
                <p className="text-2xl font-semibold tracking-tight text-sea">{c.full_name}</p>
                <p className="mt-3 text-sm text-muted">{c.reservations_count} salidas</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-sea">Demanda por día de la semana</h2>
        <div className="mt-3 space-y-2">
          {byWeekday.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay reservas en el último mes.</p>
          ) : (
            byWeekday.map((r) => (
              <div
                key={r.weekday}
                className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
              >
                <p className="text-2xl font-semibold tracking-tight text-sea">
                  {weekdayLabelsEs[r.weekday] ?? ""}
                </p>
                <p className="mt-3 text-sm text-muted">{r.occupied} reservas</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
