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
  const ogLogoUrl = new URL(`/garbi.png`, baseUrl).toString();
  const ogDynamicUrl = new URL(`/${schoolSlug}/salidas/${eventId}/opengraph-image`, baseUrl).toString();

  return {
    metadataBase: new URL(baseUrl),
    title: trip.title,
    description,
    openGraph: {
      type: "website",
      url,
      title: trip.title,
      description,
      images: [
        {
          url: ogLogoUrl,
          width: 1200,
          height: 630,
          alt: trip.title,
        },
        {
          url: ogDynamicUrl,
          width: 1200,
          height: 630,
          alt: trip.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: trip.title,
      description,
      images: [ogLogoUrl],
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
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Salida</p>
        </header>

        <section className="mt-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-sea">{trip.title}</h1>

          <p className="mt-3 text-base font-semibold text-sea">
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
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Punto de encuentro</p>
                <p className="mt-0.5 text-sm text-sea">{trip.meeting_point}</p>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Plazas</p>
              <p className="mt-0.5 text-sm text-sea">{spotsLeft} disponibles</p>
            </div>
          </div>

          {trip.description ? (
            <div className="mt-4 border-t border-border/60 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Detalles</p>
              <p className="mt-2 text-sm text-muted whitespace-pre-wrap">{trip.description}</p>
            </div>
          ) : null}
        </section>

        {warningText ? (
          <div
            className={
              trip.status === "cancelled"
                ? "mt-6 rounded-2xl border border-coral/30 bg-coral/10 p-4 text-sm text-coral"
                : "mt-6 rounded-2xl border border-border bg-surface-2 p-4 text-sm text-sea"
            }
          >
            <p className="font-semibold text-sea">Aviso</p>
            <p className="mt-1 text-muted">{warningText}</p>
          </div>
        ) : null}

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-base font-semibold text-sea">Apúntate</h2>
        <p className="mt-1 text-sm text-muted">Son dos datos y listo.</p>
        {!canBook ? (
          <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm text-sea">
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
