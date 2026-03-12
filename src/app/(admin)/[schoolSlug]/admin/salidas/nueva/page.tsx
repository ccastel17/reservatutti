import { createTrip } from "./actions";

type Props = {
  params: Promise<{ schoolSlug: string }>;
};

export default async function NewTripPage({ params }: Props) {
  const { schoolSlug } = await params;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <h1 className="text-xl font-semibold text-slate-900">Nueva salida</h1>
      <p className="mt-1 text-sm text-slate-600">Crea una salida puntual en menos de 1 minuto.</p>

      <form action={createTrip} className="mt-6 space-y-4">
        <input type="hidden" name="schoolSlug" value={schoolSlug} />

        <div>
          <label className="block text-sm font-medium text-slate-700">Título</label>
          <input
            name="title"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
            placeholder="Ej. Salida al atardecer"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Fecha</label>
            <input
              type="date"
              name="date"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Hora</label>
            <input
              type="time"
              name="time"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-900"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Duración (min)</label>
            <input
              type="number"
              name="durationMinutes"
              defaultValue={120}
              min={30}
              max={600}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Plazas</label>
            <input
              type="number"
              name="capacity"
              defaultValue={8}
              min={1}
              max={200}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-900"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Punto de encuentro (opcional)</label>
          <input
            name="meetingPoint"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
            placeholder="Ej. Pantalanes del Port Olímpic"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Detalles (opcional)</label>
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
            placeholder="Qué se necesita, duración aproximada, etc."
          />
        </div>

        <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white">
          Crear salida
        </button>
      </form>
    </main>
  );
}
