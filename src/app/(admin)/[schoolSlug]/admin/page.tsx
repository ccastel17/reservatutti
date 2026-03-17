import Link from "next/link";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getHiddenTripsBySchoolId, getTripsBySchoolId } from "@/lib/data/adminTrips";
import { CopyToClipboardOnLoad } from "@/components/admin/CopyToClipboardOnLoad";
import { AdminTripsViewSelect } from "@/components/admin/AdminTripsViewSelect";
import { AdminTripsCategorySelect } from "@/components/admin/AdminTripsCategorySelect";

type Props = {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ ok?: string; err?: string; share?: string; view?: string; cat?: string }>;
};

type ViewKey =
  | "todas"
  | "proximas"
  | "pasadas"
  | "recurrentes"
  | "canceladas"
  | "abiertas"
  | "completas";

export default async function AdminHomePage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const sp = await searchParams;

  const view =
    sp.view === "todas" ||
    sp.view === "pasadas" ||
    sp.view === "recurrentes" ||
    sp.view === "canceladas" ||
    sp.view === "abiertas" ||
    sp.view === "completas"
      ? (sp.view as ViewKey)
      : ("proximas" as const);

  const category =
    sp.cat === "trip" || sp.cat === "theory" || sp.cat === "practice"
      ? (sp.cat as "trip" | "theory" | "practice")
      : null;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const shareUrl = sp.share ? new URL(sp.share, baseUrl).toString() : null;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin`,
  });

  const supabase = await getSupabaseServer();

  const allVisibleTrips = await getTripsBySchoolId(supabase, school.id, {
    visibleOnly: true,
    daysBack: 120,
    daysForward: 365,
    limit: 250,
  });
  const hidden = await getHiddenTripsBySchoolId(supabase, school.id);

  const now = new Date();

  const visibleTripsForView = allVisibleTrips.filter((t) => {
    const startsAt = new Date(t.starts_at);
    const isFuture = startsAt >= now;

    if (category && t.category !== category) return false;

    if (view === "todas") return true;
    if (view === "proximas") return isFuture && t.status !== "cancelled";
    if (view === "pasadas") return startsAt < now;
    if (view === "recurrentes") return isFuture && t.series_id;
    if (view === "canceladas") return t.status === "cancelled";
    if (view === "abiertas") return isFuture && t.status === "scheduled";
    if (view === "completas") return isFuture && t.status === "scheduled";
    return isFuture;
  });

  const visibleTripIds = visibleTripsForView.map((t) => t.id);
  const reservationsByEventId = new Map<
    string,
    Array<{
      id: string;
      participant_name: string;
      participant_phone_e164: string;
      has_plus_one: boolean;
      created_at: string;
    }>
  >();

  if (visibleTripIds.length > 0) {
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("id, event_id, participant_name, participant_phone_e164, has_plus_one, created_at")
      .eq("school_id", school.id)
      .eq("status", "confirmed")
      .in("event_id", visibleTripIds)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const rows =
      (reservations ?? []) as Array<{
        id: string;
        event_id: string;
        participant_name: string;
        participant_phone_e164: string;
        has_plus_one: boolean;
        created_at: string;
      }>;

    for (const r of rows) {
      const list = reservationsByEventId.get(r.event_id) ?? [];
      list.push({
        id: r.id,
        participant_name: r.participant_name,
        participant_phone_e164: r.participant_phone_e164,
        has_plus_one: r.has_plus_one,
        created_at: r.created_at,
      });
      reservationsByEventId.set(r.event_id, list);
    }
  }

  const occupiedByEventId = new Map<string, number>();
  for (const t of visibleTripsForView) {
    const reservations = reservationsByEventId.get(t.id) ?? [];
    const occupied = reservations.reduce((sum, r) => sum + 1 + (r.has_plus_one ? 1 : 0), 0);
    occupiedByEventId.set(t.id, occupied);
  }

  const visibleTripsForViewFiltered =
    view === "abiertas"
      ? visibleTripsForView.filter((t) => (occupiedByEventId.get(t.id) ?? 0) < t.capacity)
      : view === "completas"
        ? visibleTripsForView.filter((t) => (occupiedByEventId.get(t.id) ?? 0) >= t.capacity)
        : visibleTripsForView;

  const visibleTripsSorted = [...visibleTripsForViewFiltered];
  if (view === "pasadas") {
    visibleTripsSorted.sort(
      (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
    );
  } else {
    visibleTripsSorted.sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
  }

  const viewTitle: Record<ViewKey, string> = {
    todas: "Todas las salidas",
    proximas: "Próximas salidas publicadas",
    pasadas: "Salidas pasadas",
    recurrentes: "Salidas recurrentes",
    canceladas: "Salidas canceladas",
    abiertas: "Salidas abiertas",
    completas: "Salidas completas",
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      {shareUrl ? <CopyToClipboardOnLoad text={shareUrl} /> : null}
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Panel</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight text-sea">{school.name}</h1>
        <p className="mt-2 text-base text-muted">Qué hay próximo y qué falta por publicar.</p>
      </div>

      {sp.ok ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {sp.ok}
        </div>
      ) : null}
      {sp.err ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {sp.err}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/${schoolSlug}/admin/salidas/nueva`}
          className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white shadow-sm"
        >
          Nuevo evento
        </Link>
        <Link
          href={`/${schoolSlug}/admin/series/nueva`}
          className="rounded-xl border border-brand bg-surface px-4 py-3 text-center text-sm font-semibold text-brand shadow-sm"
        >
          Evento semanal
        </Link>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-sea">{viewTitle[view]}</h2>
        </div>

        <div className="mt-3">
          <AdminTripsViewSelect
            value={view}
            options={[
              { key: "todas", label: "Todas" },
              { key: "proximas", label: "Próximas" },
              { key: "abiertas", label: "Abiertas" },
              { key: "completas", label: "Completas" },
              { key: "recurrentes", label: "Recurrentes" },
              { key: "pasadas", label: "Pasadas" },
              { key: "canceladas", label: "Canceladas" },
            ]}
          />
        </div>

        <div className="mt-3">
          <AdminTripsCategorySelect value={category ?? ""} />
        </div>

        <div className="mt-3 space-y-2">
          {visibleTripsSorted.length === 0 ? (
            <p className="text-sm text-muted">No hay salidas en esta vista.</p>
          ) : (
            visibleTripsSorted.map((t) => {
              const reservations = reservationsByEventId.get(t.id) ?? [];
              const occupied = occupiedByEventId.get(t.id) ?? 0;

              return (
                <Link
                  key={t.id}
                  href={`/${schoolSlug}/admin/salidas/${t.id}/inscritos`}
                  className="block rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-2xl font-semibold tracking-tight text-sea">{t.title}</p>
                      <p className="mt-1 text-base font-semibold text-brand-700">
                        {new Date(t.starts_at).toLocaleString("es-ES", {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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

                      {t.status === "scheduled" && occupied >= t.capacity ? (
                        <span className="rounded-full bg-sea-50 px-2.5 py-1 text-xs font-semibold text-sea">
                          Completa
                        </span>
                      ) : null}

                      <span className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-sea shadow-sm">
                        Ver salida
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center">
                    <p className="text-sm text-muted">{occupied} / {t.capacity} plazas</p>
                  </div>

                  {reservations.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {reservations.map((r, idx) => (
                        <p key={r.id} className="text-sm text-muted">
                          {idx + 1}. {r.participant_name}
                          {r.has_plus_one ? " (+1)" : ""} · {r.participant_phone_e164}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted">Aún no hay inscritos.</p>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-sea">Programadas (ocultas)</h2>
          <Link href={`/${schoolSlug}/admin/ocurrencias`} className="text-sm font-medium text-muted">
            Gestionar
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {hidden.length === 0 ? (
            <p className="text-sm text-muted">No tienes salidas ocultas.</p>
          ) : (
            hidden.slice(0, 5).map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <p className="text-sm font-semibold text-sea">{t.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {new Date(t.starts_at).toLocaleString("es-ES", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
