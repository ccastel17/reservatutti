import { createTrip } from "./actions";

type Props = {
  params: Promise<{ schoolSlug: string }>;
};

export default async function NewTripPage({ params }: Props) {
  const { schoolSlug } = await params;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Panel</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-sea">Nueva salida</h1>
      <p className="mt-1 text-sm text-muted">Crea una salida puntual en menos de 1 minuto.</p>

      <form action={createTrip} className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <input type="hidden" name="schoolSlug" value={schoolSlug} />

        <div>
          <label className="block text-sm font-medium text-sea">Título</label>
          <input
            name="title"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
            placeholder="Ej. Salida al atardecer"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-sea">Fecha</label>
            <input
              type="date"
              name="date"
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea outline-none focus:border-brand"
              required
            />
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
            <label className="block text-sm font-medium text-sea">Duración (min)</label>
            <input
              type="number"
              name="durationMinutes"
              defaultValue={120}
              min={30}
              max={600}
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
            placeholder="Ej. Pantalanes del Port Olímpic"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-sea">Detalles (opcional)</label>
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
            placeholder="Qué se necesita, duración aproximada, etc."
          />
        </div>

        <button className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-sm">
          Crear salida
        </button>
      </form>
    </main>
  );
}
