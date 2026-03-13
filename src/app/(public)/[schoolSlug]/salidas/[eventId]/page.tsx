import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicTripDetailBySlugAndId } from "@/lib/data/publicTrips";
import { ReservationForm } from "@/components/forms/ReservationForm";

type Props = {
  params: Promise<{ schoolSlug: string; eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug, eventId } = await params;

  const detail = await getPublicTripDetailBySlugAndId({ schoolSlug, tripId: eventId });
  if (!detail) return {};

  const { trip } = detail;
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const when = new Date(trip.starts_at).toLocaleString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const oneLine = (trip.description ?? "")
    .split("\n")
    .map((s) => s.trim())
    .find(Boolean);

  const description = `${when}${oneLine ? ` · ${oneLine}` : ""}`.slice(0, 180);
  const url = new URL(`/${schoolSlug}/salidas/${eventId}`, baseUrl).toString();

  return {
    metadataBase: new URL(baseUrl),
    title: trip.title,
    description,
    openGraph: {
      type: "website",
      url,
      title: trip.title,
      description,
    },
    twitter: {
      card: "summary",
      title: trip.title,
      description,
    },
  };
}

export default async function PublicTripDetailPage({ params }: Props) {
  const { schoolSlug, eventId } = await params;

  const detail = await getPublicTripDetailBySlugAndId({
    schoolSlug,
    tripId: eventId,
  });

  if (!detail) notFound();

  const { trip, spotsLeft } = detail;
  const canBook = trip.status === "scheduled" && spotsLeft > 0;
  const warningText =
    trip.status === "cancelled"
      ? "Esta salida está cancelada."
      : trip.status === "closed"
        ? "Las inscripciones están cerradas."
        : !canBook
          ? "Ahora mismo no quedan plazas."
          : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <header className="space-y-2">
          <p className="text-sm text-slate-600">Salida</p>
        </header>

        <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{trip.title}</h1>

          <p className="mt-3 text-base font-semibold text-slate-900">
            {new Date(trip.starts_at).toLocaleString("es-ES", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          <div className="mt-4 space-y-2 text-sm">
            {trip.meeting_point ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Punto de encuentro</p>
                <p className="mt-0.5 text-sm text-slate-800">{trip.meeting_point}</p>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plazas</p>
              <p className="mt-0.5 text-sm text-slate-800">{spotsLeft} disponibles</p>
            </div>
          </div>

          {trip.description ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Detalles</p>
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{trip.description}</p>
            </div>
          ) : null}
        </section>

        {warningText ? (
          <div
            className={
              trip.status === "cancelled"
                ? "mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                : "mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"
            }
          >
            <p className="font-semibold">Aviso</p>
            <p className="mt-1">{warningText}</p>
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
      </main>
    </div>
  );
}
