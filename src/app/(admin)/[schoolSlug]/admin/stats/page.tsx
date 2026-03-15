import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  getBookingsByWeekday,
  getTopContacts,
  getTripOccupancyStats,
} from "@/lib/data/stats";
import { AdminStatsPanel } from "@/components/admin/AdminStatsPanel";

type Props = {
  params: Promise<{ schoolSlug: string }>;
};

export default async function AdminStatsPage({ params }: Props) {
  const { schoolSlug } = await params;

  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin/stats`,
  });

  const supabase = await getSupabaseServer();

  const [occupancy, topContacts, byWeekday] = await Promise.all([
    getTripOccupancyStats(supabase, school.id),
    getTopContacts(supabase, school.id),
    getBookingsByWeekday(supabase, school.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Panel</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight text-sea">Stats</h1>
        <p className="mt-2 text-base text-muted">{school.name}</p>
      </div>

      <AdminStatsPanel occupancy={occupancy} topContacts={topContacts} byWeekday={byWeekday} />
    </main>
  );
}
