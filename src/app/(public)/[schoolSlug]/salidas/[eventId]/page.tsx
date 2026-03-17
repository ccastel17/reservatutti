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

  return {
    metadataBase: new URL(baseUrl),
    title: trip.title,
    description,
    robots: {
      index: true,
      follow: true,
    },
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

  const { trip, spotsLeft, confirmed, pending } = detail;
  const canBook = trip.status === "scheduled";
  const warningText =
    trip.status === "cancelled"
      ? "Esta salida está cancelada."
      : trip.status === "closed"
        ? "Las inscripciones están cerradas."
        : spotsLeft <= 0
          ? "Ahora mismo no quedan plazas. Puedes apuntarte en lista de espera."
          : null;

  const whenFull = new Date(trip.starts_at).toLocaleString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusBadge =
    trip.status === "cancelled"
      ? { label: "Cancelada", className: "bg-coral/15 text-coral" }
      : trip.status === "closed"
        ? { label: "Cerrada", className: "bg-surface-2 text-muted" }
        : null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Salida</p>
        </header>

        <section className="mt-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-sea">{trip.title}</h1>
            {statusBadge ? (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {whenFull}
            </span>
            <span className="inline-flex items-center rounded-full bg-sea-50 px-2.5 py-1 text-xs font-semibold text-sea">
              {spotsLeft} plazas
            </span>
          </div>

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
                ? "mt-6 rounded-2xl border border-coral/30 bg-coral/10 p-4"
                : trip.status === "closed"
                  ? "mt-6 rounded-2xl border border-border bg-surface-2 p-4"
                  : "mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4"
            }
          >
            <p className="text-sm font-semibold text-sea">Aviso</p>
            <p className={trip.status === "scheduled" && spotsLeft <= 0 ? "mt-1 text-sm text-amber-800" : "mt-1 text-sm text-muted"}>
              {warningText}
            </p>
          </div>
        ) : null}

        {(confirmed.length > 0 || pending.length > 0) && trip.status !== "cancelled" ? (
          <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-base font-semibold text-sea">Participantes</h2>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-sea">Inscriptos</p>
              <span className="rounded-full bg-sea-50 px-2.5 py-1 text-xs font-semibold text-sea">{confirmed.length}</span>
            </div>

            {confirmed.length === 0 ? (
              <div className="mt-2 rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-sm text-muted">Aún no hay inscriptos.</p>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {confirmed.map((r, idx) => (
                  <div key={r.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                    <p className="text-sm font-semibold text-sea">
                      {idx + 1}. {r.participantName}
                      {r.hasPlusOne ? " (+1)" : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-sea">Lista de espera</p>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {pending.length}
              </span>
            </div>

            {pending.length === 0 ? (
              <div className="mt-2 rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-sm text-muted">No hay nadie en lista de espera.</p>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {pending.map((r, idx) => (
                  <div key={r.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-sea">
                        {idx + 1}. {r.participantName}
                        {r.hasPlusOne ? " (+1)" : ""}
                      </p>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        En espera
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
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
