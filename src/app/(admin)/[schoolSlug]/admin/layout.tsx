import Link from "next/link";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { AdminTopTabs } from "@/components/admin/AdminTopTabs";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const { school } = await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin`,
  });

  let activityUnreadCount = 0;
  try {
    const supabase = await getSupabaseServer();
    const { count } = await supabase
      .from("school_activity")
      .select("id", { count: "exact", head: true })
      .eq("school_id", school.id)
      .is("read_at", null);
    activityUnreadCount = count ?? 0;
  } catch {
    activityUnreadCount = 0;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-4">
          <Link href={`/${schoolSlug}/admin`} className="shrink-0">
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-sea">Reserva</span>
              <span className="text-brand-700">Tutti</span>
            </span>
          </Link>
          <AdminTopTabs schoolSlug={schoolSlug} activityUnreadCount={activityUnreadCount} />
        </div>
      </header>

      {children}
    </div>
  );
}
