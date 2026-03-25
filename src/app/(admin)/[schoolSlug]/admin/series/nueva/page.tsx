import { createWeeklyTemplate } from "./actions";

type Props = {
  params: Promise<{ schoolSlug: string }>;
};

const weekdays = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

export default async function NewSeriesPage({ params }: Props) {
  const { schoolSlug } = await params;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Panel</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-sea">Salida semanal</h1>
      <p className="mt-1 text-sm text-muted">Crearemos ocurrencias futuras (ocultas) para que las publiques cuando toque.</p>

      <form action={createWeeklyTemplate} className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <input type="hidden" name="schoolSlug" value={schoolSlug} />

        <div>
          <label className="block text-sm font-medium text-sea">Título</label>
          <input
            name="title"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
            placeholder="Ej. Prácticas de vela"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-sea">Día</label>
            <select
              name="weekday"
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea outline-none focus:border-brand"
              defaultValue={6}
            >
              {weekdays.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-sea">Hora</label>
            <input
              type="time"
              name="time"
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
              defaultValue={2}
              min={0.5}
              max={10}
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
              defaultValue={8}
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
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-sea">Detalles (opcional)</label>
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-4">
          <input type="checkbox" name="requiresMinCapacity" className="mt-1 h-4 w-4" />
          <div>
            <p className="text-sm font-semibold text-sea">Cupo mínimo requerido obligatorio</p>
            <p className="text-xs text-muted">
              Si se marca, las ocurrencias mostrarán el estado de confirmación y avisarán en Actividad cuando se complete el cupo.
            </p>
          </div>
        </label>

        <button className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-sm">
          Crear salida semanal
        </button>
      </form>
    </main>
  );
}
