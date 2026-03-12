import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getHiddenTripsBySchoolId } from "@/lib/data/adminTrips";
import { publishOccurrence } from "./actions";

type Props = {
  params: Promise<{ schoolSlug: string }>;
};

export default async function OccurrencesPage({ params }: Props) {
  const { schoolSlug } = await params;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/ocurrencias`,
  });

  const supabase = await getSupabaseServer();
  const hidden = await getHiddenTripsBySchoolId(supabase, school.id);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <h1 className="text-xl font-semibold text-slate-900">Salidas ocultas</h1>
      <p className="mt-1 text-sm text-slate-600">Estas salidas no aparecen en la parte pública.</p>

      <div className="mt-5 space-y-3">
        {hidden.length === 0 ? (
          <p className="text-sm text-slate-600">No hay salidas ocultas.</p>
        ) : (
          hidden.map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {new Date(t.starts_at).toLocaleString("es-ES", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <form action={publishOccurrence} className="mt-4">
                <input type="hidden" name="schoolSlug" value={schoolSlug} />
                <input type="hidden" name="eventId" value={t.id} />
                <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  Hacer visible
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
