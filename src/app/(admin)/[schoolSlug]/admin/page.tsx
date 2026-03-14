import Link from "next/link";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getHiddenTripsBySchoolId, getUpcomingTripsBySchoolId } from "@/lib/data/adminTrips";
import { CopyToClipboardOnLoad } from "@/components/admin/CopyToClipboardOnLoad";

type Props = {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ ok?: string; err?: string; share?: string }>;
};

export default async function AdminHomePage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const sp = await searchParams;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const shareUrl = sp.share ? new URL(sp.share, baseUrl).toString() : null;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin`,
  });

  const supabase = await getSupabaseServer();

  const upcomingVisible = await getUpcomingTripsBySchoolId(supabase, school.id, {
    visibleOnly: true,
  });
  const hidden = await getHiddenTripsBySchoolId(supabase, school.id);

  const upcomingIds = upcomingVisible.map((t) => t.id);
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

  if (upcomingIds.length > 0) {
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("id, event_id, participant_name, participant_phone_e164, has_plus_one, created_at")
      .eq("school_id", school.id)
      .eq("status", "confirmed")
      .in("event_id", upcomingIds)
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
          Nueva salida
        </Link>
        <Link
          href={`/${schoolSlug}/admin/series/nueva`}
          className="rounded-xl border border-brand bg-surface px-4 py-3 text-center text-sm font-semibold text-brand shadow-sm"
        >
          Salida semanal
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-sea">Próximas salidas publicadas</h2>
        <div className="mt-3 space-y-2">
          {upcomingVisible.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay salidas publicadas.</p>
          ) : (
            upcomingVisible.map((t) => {
              const reservations = reservationsByEventId.get(t.id) ?? [];
              const occupied = reservations.reduce(
                (sum, r) => sum + 1 + (r.has_plus_one ? 1 : 0),
                0
              );

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
