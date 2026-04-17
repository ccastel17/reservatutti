import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchoolBySlug } from "@/lib/data/schools";
import { getPublicUpcomingTripsBySlug } from "@/lib/data/publicTrips";

type Props = {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ cat?: string; page?: string }>;
};

export default async function PublicSchoolTripsPage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const sp = await searchParams;

  const category =
    sp.cat === "trip" || sp.cat === "theory" || sp.cat === "practice"
      ? (sp.cat as "trip" | "theory" | "practice")
      : "trip";

  const page = (() => {
    const n = Number(sp.page ?? "1");
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  })();

  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const listing = await getPublicUpcomingTripsBySlug({ schoolSlug, category, page, pageSize: 5 });
  const trips = listing?.trips ?? [];
  const totalCount = listing?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 5));

  const catLabel =
    category === "trip" ? "Salidas de club" : category === "theory" ? "Clases teóricas" : "Clases prácticas";

  const subtitle =
    category === "trip"
      ? "Próximas salidas de club publicadas"
      : category === "theory"
        ? "Próximas clases teóricas"
        : "Próximas clases prácticas";

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

  const tabBase =
    "rounded-xl px-3 py-2 text-center text-sm font-semibold whitespace-normal leading-tight";
  const tabActive = `${tabBase} bg-brand text-white shadow-sm`;
  const tabInactive = `${tabBase} text-muted hover:text-sea`;

  const makeHref = (cat: string, p: number) => `/${schoolSlug}/salidas?cat=${cat}&page=${p}`;

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{school.slug}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-sea">{school.name}</h1>
          <p className="text-sm text-muted">{subtitle}</p>
        </header>

        <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-1">
          <div className="grid grid-cols-3 gap-1">
            <Link href={makeHref("trip", 1)} className={category === "trip" ? tabActive : tabInactive}>
              <span className="block">Salidas</span>
              <span className="block">de club</span>
            </Link>
            <Link href={makeHref("theory", 1)} className={category === "theory" ? tabActive : tabInactive}>
              <span className="block">Clases</span>
              <span className="block">teóricas</span>
            </Link>
            <Link href={makeHref("practice", 1)} className={category === "practice" ? tabActive : tabInactive}>
              <span className="block">Clases</span>
              <span className="block">Prácticas</span>
            </Link>
          </div>
        </div>

        <section className="mt-6 space-y-2">
          {trips.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <p className="text-sm font-semibold text-sea">No hay {catLabel.toLowerCase()} ahora mismo.</p>
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

                    {t.status === "scheduled" && t.requires_min_capacity ? (
                      t.occupied >= (t.min_capacity ?? t.capacity) ? (
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                          Confirmada
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          Sin confirmar
                        </span>
                      )
                    ) : null}

                    <span className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-sea shadow-sm">
                      Ver
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

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-sea">Página {page} de {totalPages}</p>
            <p className="mt-1 text-xs text-muted">Mostrando 5 por página</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={makeHref(category, prevPage)}
              aria-disabled={page <= 1}
              className={
                page <= 1
                  ? "rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-muted"
                  : "rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
              }
            >
              Anterior
            </Link>
            <Link
              href={makeHref(category, nextPage)}
              aria-disabled={page >= totalPages}
              className={
                page >= totalPages
                  ? "rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-muted"
                  : "rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
              }
            >
              Siguiente
            </Link>
          </div>
        </div>

        <footer className="mt-8">
          <Link href={`/${schoolSlug}`} className="text-sm font-semibold text-muted">
            Volver
          </Link>
        </footer>
      </main>
    </div>
  );
}
