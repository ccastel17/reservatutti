import { notFound } from "next/navigation";
import { getPublicTripDetailBySlugAndId } from "@/lib/data/publicTrips";
import { ReservationForm } from "@/components/forms/ReservationForm";

type Props = {
  params: Promise<{ schoolSlug: string; eventId: string }>;
};

export default async function PublicTripDetailPage({ params }: Props) {
  const { schoolSlug, eventId } = await params;

  const detail = await getPublicTripDetailBySlugAndId({
    schoolSlug,
    tripId: eventId,
  });

  if (!detail) notFound();

  const { trip, spotsLeft } = detail;
  const canBook = trip.status === "scheduled" && spotsLeft > 0;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm text-slate-600">Salida</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{trip.title}</h1>
        <div className="space-y-1 text-sm text-slate-700">
          <p>
            <span className="font-medium">Fecha y hora: </span>
            {new Date(trip.starts_at).toLocaleString("es-ES", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {trip.meeting_point ? (
            <p>
              <span className="font-medium">Punto de encuentro: </span>
              {trip.meeting_point}
            </p>
          ) : null}
          <p>
            <span className="font-medium">Plazas: </span>
            {spotsLeft} disponibles
          </p>
        </div>
      </header>

      {trip.status === "cancelled" ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Esta salida está cancelada.
        </div>
      ) : null}

      {trip.status === "closed" ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          Las inscripciones están cerradas.
        </div>
      ) : null}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Apúntate</h2>
        <p className="mt-1 text-sm text-slate-600">Son dos datos y listo.</p>
        {!canBook ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {trip.status === "cancelled"
              ? "No puedes apuntarte porque la salida está cancelada."
              : trip.status === "closed"
                ? "No puedes apuntarte porque las inscripciones están cerradas."
                : "Ahora mismo no quedan plazas."}
          </div>
        ) : (
          <ReservationForm schoolSlug={schoolSlug} tripId={eventId} spotsLeft={spotsLeft} />
        )}
      </section>

      {trip.description ? (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900">Detalles</h3>
          <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{trip.description}</p>
        </section>
      ) : null}
    </main>
  );
}
