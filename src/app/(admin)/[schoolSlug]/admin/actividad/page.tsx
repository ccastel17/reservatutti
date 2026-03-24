import Link from "next/link";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import { markActivityRead } from "./actions";

type Props = {
  params: Promise<{ schoolSlug: string }>;
};

type ActivityRow = {
  id: string;
  type: string;
  created_at: string;
  read_at: string | null;
  participant_name: string | null;
  participant_phone_e164: string | null;
  event_id: string | null;
  reservation_id: string | null;
  payload: unknown;
  events: {
    title: string;
    starts_at: string;
    ends_at: string;
  } | null;
};

export default async function AdminActivityPage({ params }: Props) {
  const { schoolSlug } = await params;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/actividad`,
  });

  const supabase = await getSupabaseServer();

  let rows: ActivityRow[] = [];
  try {
    const { data } = await supabase
      .from("school_activity")
      .select(
        "id, type, created_at, read_at, participant_name, participant_phone_e164, event_id, reservation_id, payload, events ( title, starts_at, ends_at )"
      )
      .eq("school_id", school.id)
      .order("created_at", { ascending: false })
      .limit(80);

    rows = (data ?? []) as unknown as ActivityRow[];
  } catch {
    rows = [];
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatEventDateTime = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return `${date} ${time}`;
  };

  const getTripDuplicatedPayload = (payload: unknown) => {
    if (typeof payload !== "object" || payload === null) return null;
    const p = payload as {
      moved_names?: unknown;
      public_path?: unknown;
      starts_at?: unknown;
    };

    const movedNames = Array.isArray(p.moved_names)
      ? p.moved_names.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
      : [];

    const publicPath = typeof p.public_path === "string" ? p.public_path : null;
    const startsAt = typeof p.starts_at === "string" ? p.starts_at : null;

    return { movedNames, publicPath, startsAt };
  };

  const buildWhatsAppMessage = (r: ActivityRow) => {
    const title = r.events?.title ?? "";
    const start = r.events?.starts_at ? new Date(r.events.starts_at) : null;
    const day = start
      ? start.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" })
      : "";
    const time = start ? start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "";

    if (r.type === "trip_duplicated") {
      const p = getTripDuplicatedPayload(r.payload);
      const startsAt = p?.startsAt ? new Date(p.startsAt) : start;
      const day2 = startsAt
        ? startsAt.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" })
        : day;
      const publicLink = p?.publicPath ? `https://www.reservatutti.com${p.publicPath}` : "";
      return `Se ha creado una salida nueva para el "${day2}". Revisar lista de confirmados. ${publicLink}`.trim();
    }

    if (r.type === "waitlist_promoted") {
      return `Sobre tu inscripción en "${title}" (${day} ${time}). Ya has sido confirmado. Contáctanos por cualquier duda. Saludos.`;
    }

    return `Sobre tu inscripción en "${title}" (${day} ${time}).`;
  };

  const isPromotionFromAdminCancellation = (payload: unknown) => {
    if (typeof payload !== "object" || payload === null) return false;
    if (!("cancelled_reservation_id" in payload)) return false;
    const value = (payload as { cancelled_reservation_id?: unknown }).cancelled_reservation_id;
    return typeof value === "string" && value.length > 0;
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Panel</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-sea">Actividad</h1>
      <p className="mt-1 text-sm text-muted">Movimientos y notificaciones de la escuela.</p>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm font-semibold text-sea">Sin actividad todavía.</p>
          <p className="mt-1 text-sm text-muted">Cuando entren reservas pendientes o se confirmen, aparecerán aquí.</p>
        </div>
      ) : (
        <section className="mt-6 space-y-2">
          {rows.map((r) => {
            const unread = !r.read_at;
            const phoneDigits = (r.participant_phone_e164 ?? "").replace(/\D/g, "");
            const waLink = phoneDigits
              ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(buildWhatsAppMessage(r))}`
              : null;

            const tripDuplicatedPayload = r.type === "trip_duplicated" ? getTripDuplicatedPayload(r.payload) : null;
            const adminWaLink = r.type === "trip_duplicated"
              ? `https://wa.me/?text=${encodeURIComponent(buildWhatsAppMessage(r))}`
              : null;

            const title =
              r.type === "waitlist_promoted"
                ? isPromotionFromAdminCancellation(r.payload)
                  ? `El usuario "${r.participant_name ?? ""}" pasó a confirmados en la salida "${
                      r.events?.title ?? ""
                    }"${r.events?.starts_at ? ` (${formatEventDateTime(r.events.starts_at)})` : ""}.`
                  : `El usuario "${r.participant_name ?? ""}" pasó de lista de espera a confirmado para la salida "${
                      r.events?.title ?? ""
                    }"${r.events?.starts_at ? ` (${formatEventDateTime(r.events.starts_at)})` : ""}.`
                : r.type === "waitlist_joined"
                  ? "Nueva persona en lista de espera"
                  : r.type === "trip_duplicated"
                    ? `Se creó una salida nueva con ${tripDuplicatedPayload?.movedNames.length ?? 0} integrantes.`
                  : "Actividad";

            const subtitle = r.type === "waitlist_promoted" ? null : r.events?.title ? r.events.title : null;

            return (
              <details key={r.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-sea">
                        {title}{" "}
                        {unread ? (
                          <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-brand align-middle" />
                        ) : null}
                      </p>
                      {subtitle ? <p className="mt-1 text-sm text-muted truncate">{subtitle}</p> : null}
                      <p className="mt-1 text-xs text-muted">{formatDate(r.created_at)}</p>
                    </div>
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
                      Ver
                    </span>
                  </div>
                </summary>

                <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
                  {r.type === "trip_duplicated" ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">Integrantes</p>
                      {tripDuplicatedPayload && tripDuplicatedPayload.movedNames.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {tripDuplicatedPayload.movedNames.map((name) => (
                            <p key={name} className="text-sm font-semibold text-sea">
                              {name}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-muted">No se movieron integrantes.</p>
                      )}

                      {tripDuplicatedPayload?.publicPath ? (
                        <Link
                          href={tripDuplicatedPayload.publicPath}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
                        >
                          Ver publicación
                        </Link>
                      ) : null}
                    </div>
                  ) : null}

                  {r.participant_name ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">Persona</p>
                      <p className="mt-1 text-sm font-semibold text-sea">{r.participant_name}</p>
                      {r.participant_phone_e164 ? <p className="mt-0.5 text-sm text-muted">{r.participant_phone_e164}</p> : null}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-2">
                    {adminWaLink ? (
                      <Link
                        href={adminWaLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
                      >
                        Enviar WhatsApp
                      </Link>
                    ) : null}

                    {waLink ? (
                      <Link
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
                      >
                        Contactar por WhatsApp
                      </Link>
                    ) : null}

                    {unread ? (
                      <form action={markActivityRead}>
                        <input type="hidden" name="schoolSlug" value={schoolSlug} />
                        <input type="hidden" name="activityId" value={r.id} />
                        <button className="rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white shadow-sm">
                          Marcar como leído
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </details>
            );
          })}
        </section>
      )}

      <footer className="mt-8">
        <Link href={`/${schoolSlug}/admin`} className="text-sm font-semibold text-muted">
          Volver al panel
        </Link>
      </footer>
    </main>
  );
}
