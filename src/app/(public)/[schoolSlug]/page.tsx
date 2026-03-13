import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchoolBySlug } from "@/lib/data/schools";
import { getPublicUpcomingTripsBySlug } from "@/lib/data/publicTrips";

type Props = {
  params: Promise<{ schoolSlug: string }>;
};

export default async function PublicSchoolHomePage({ params }: Props) {
  const { schoolSlug } = await params;

  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const listing = await getPublicUpcomingTripsBySlug({ schoolSlug });
  const trips = listing?.trips ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-md px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm text-slate-600">{school.slug}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{school.name}</h1>
        <p className="text-sm text-slate-600">Próximas salidas publicadas</p>
      </header>

      <section className="mt-6 space-y-2">
        {trips.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-900">No hay salidas publicadas ahora mismo.</p>
            <p className="mt-1 text-sm text-slate-600">Vuelve más tarde.</p>
          </div>
        ) : (
          trips.map((t) => (
            <Link
              key={t.id}
              href={`/${schoolSlug}/salidas/${t.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.status !== "scheduled" ? (
                  <span
                    className={
                      t.status === "cancelled"
                        ? "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900"
                        : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                    }
                  >
                    {t.status === "cancelled" ? "Cancelada" : "Cerrada"}
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-slate-600">
                {new Date(t.starts_at).toLocaleString("es-ES", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {t.meeting_point ? <p className="mt-1 text-sm text-slate-600">{t.meeting_point}</p> : null}
            </Link>
          ))
        )}
      </section>

      <footer className="mt-8">
        <Link href={`/${schoolSlug}/admin`} className="text-sm font-medium text-slate-600">
          Acceso organizadores
        </Link>
      </footer>
      </main>
    </div>
  );
}
