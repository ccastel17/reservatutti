import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function AdminEntryPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent("/admin")}`);
  }

  const email = (user.email ?? "").toLowerCase();
  const allow = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isSuperAdmin = Boolean(email) && allow.length > 0 && allow.includes(email);

  const { data: memberships, error: membershipsError } = await supabase
    .from("school_members")
    .select("school_id")
    .eq("user_id", user.id);

  if (membershipsError) {
    redirect("/");
  }

  const schoolIds = (memberships ?? []).map((m) => m.school_id).filter(Boolean);
  const uniqueSchoolIds = Array.from(new Set(schoolIds));

  const { data: schoolsData, error: schoolsError } = await supabase
    .from("schools")
    .select("id, slug, name")
    .in("id", uniqueSchoolIds);

  if (schoolsError) {
    redirect("/");
  }

  const schools = (schoolsData ?? []).filter((s) => Boolean(s.slug));

  if (schools.length === 1) {
    redirect(`/${schools[0].slug}/admin`);
  }

  if (schools.length === 0) {
    if (isSuperAdmin) {
      redirect("/superadmin");
    }
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-md flex-col px-4 py-10">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Panel</p>
          <h1 className="text-2xl font-semibold tracking-tight text-sea">Elige una escuela</h1>
          <p className="text-sm text-muted">Tienes acceso a varias escuelas. Selecciona a cuál quieres entrar.</p>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="space-y-2">
            {schools.map((s) => (
              <Link
                key={s.id}
                href={`/${s.slug}/admin`}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
              >
                <span className="text-sm font-semibold text-sea">{s.name}</span>
                <span className="text-xs font-semibold text-brand-700">Entrar</span>
              </Link>
            ))}
          </div>
        </section>

        {isSuperAdmin ? (
          <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm font-semibold text-sea">Super Admin</p>
            <p className="mt-1 text-sm text-muted">Herramientas globales de administración.</p>
            <div className="mt-4">
              <Link href="/superadmin" className="text-sm font-semibold text-brand-700">
                Ir a Super Admin
              </Link>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
