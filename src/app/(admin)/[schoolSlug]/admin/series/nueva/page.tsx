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
      <h1 className="text-xl font-semibold text-slate-900">Salida semanal</h1>
      <p className="mt-1 text-sm text-slate-600">Crearemos ocurrencias futuras (ocultas) para que las publiques cuando toque.</p>

      <form action={createWeeklyTemplate} className="mt-6 space-y-4">
        <input type="hidden" name="schoolSlug" value={schoolSlug} />

        <div>
          <label className="block text-sm font-medium text-slate-700">Título</label>
          <input
            name="title"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
            placeholder="Ej. Prácticas de vela"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Día</label>
            <select
              name="weekday"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-900"
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
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Detalles (opcional)</label>
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
          />
        </div>

        <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white">
          Crear salida semanal
        </button>
      </form>
    </main>
  );
}
