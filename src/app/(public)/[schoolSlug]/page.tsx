import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchoolBySlug } from "@/lib/data/schools";
import { getPublicUpcomingTripsBySlug } from "@/lib/data/publicTrips";

type Props = {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ cat?: string }>;
};

export default async function PublicSchoolHomePage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const sp = await searchParams;

  const category =
    sp.cat === "trip" || sp.cat === "theory" || sp.cat === "practice"
      ? (sp.cat as "trip" | "theory" | "practice")
      : "trip";

  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const listing = await getPublicUpcomingTripsBySlug({ schoolSlug, category });
  const trips = listing?.trips ?? [];

  const catLabel = category === "trip" ? "Salidas" : category === "theory" ? "Teóricas" : "Prácticas";

  const formatDayTime = (iso: string) =>
    new Date(iso).toLocaleString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const oneLine = (text?: string | null) =>
    (text ?? "")
      .split("\n")
      .map((s) => s.trim())
      .find(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{school.slug}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-sea">{school.name}</h1>
          <p className="text-sm text-muted">Próximas {catLabel.toLowerCase()} publicadas</p>
        </header>

        <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-1">
          <div className="grid grid-cols-3 gap-1">
            <Link
              href={`/${schoolSlug}?cat=trip`}
              className={
                category === "trip"
                  ? "rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold text-sea shadow-sm"
                  : "rounded-xl px-3 py-2 text-center text-sm font-semibold text-muted hover:text-sea"
              }
            >
              Salidas
            </Link>
            <Link
              href={`/${schoolSlug}?cat=theory`}
              className={
                category === "theory"
                  ? "rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold text-sea shadow-sm"
                  : "rounded-xl px-3 py-2 text-center text-sm font-semibold text-muted hover:text-sea"
              }
            >
              Teóricas
            </Link>
            <Link
              href={`/${schoolSlug}?cat=practice`}
              className={
                category === "practice"
                  ? "rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold text-sea shadow-sm"
                  : "rounded-xl px-3 py-2 text-center text-sm font-semibold text-muted hover:text-sea"
              }
            >
              Prácticas
            </Link>
          </div>
        </div>

        <section className="mt-6 space-y-2">
          {trips.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <p className="text-sm font-semibold text-sea">
                No hay {catLabel.toLowerCase()} publicadas ahora mismo.
              </p>
              <p className="mt-1 text-sm text-muted">Vuelve más tarde.</p>
            </div>
          ) : (
            trips.map((t) => (
            <Link
              key={t.id}
              href={`/${schoolSlug}/salidas/${t.id}`}
              className="block rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-2xl font-semibold tracking-tight text-sea">{t.title}</p>
                  <p className="mt-1 text-base font-semibold text-brand-700">
                    {formatDayTime(t.starts_at)}
                    {t.ends_at ? `–${formatTime(t.ends_at)}` : ""}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {t.status !== "scheduled" ? (
                    <span
                      className={
                        t.status === "cancelled"
                          ? "rounded-full bg-coral/15 px-2.5 py-1 text-xs font-semibold text-coral"
                          : "rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted"
                      }
                    >
                      {t.status === "cancelled" ? "Cancelada" : "Cerrada"}
                    </span>
                  ) : null}

                  <span className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-sea shadow-sm">
                    Ver salida
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <p className="text-sm text-muted">
                  {t.occupied} / {t.capacity} plazas · {t.spotsLeft} disponibles
                </p>
                {t.meeting_point ? <p className="text-sm text-muted">{t.meeting_point}</p> : null}
              </div>

              {oneLine(t.description) ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted">{oneLine(t.description)}</p>
              ) : null}
            </Link>
            ))
          )}
        </section>

      <footer className="mt-8">
        <Link href={`/${schoolSlug}/admin`} className="text-sm font-semibold text-muted">
          Acceso organizadores
        </Link>
      </footer>
      </main>
    </div>
  );
}
