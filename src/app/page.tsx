import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllSchools } from "@/lib/data/schools";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const sp = await searchParams;
  const code = sp.code;

  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent("/")}`);
  }

  const schools = await getAllSchools();

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSuperAdmin = (() => {
    const email = (user?.email ?? "").toLowerCase();
    const allow = (process.env.SUPERADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return Boolean(email) && allow.length > 0 && allow.includes(email);
  })();

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-md flex-col px-4 py-10">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Reservatutti</p>
          <h1 className="text-3xl font-semibold tracking-tight text-sea">Reservas simples para escuelas y clubes</h1>
          <p className="text-sm text-muted">
            Publica actividades, gestiona plazas y lista de espera, y contacta por WhatsApp sin complicaciones.
          </p>

          <div className="pt-2">
            <Link
              href="/admin"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-sm"
            >
              Acceso organizadores
            </Link>
            <p className="mt-2 text-xs text-muted">Si eres organizador y no tienes acceso, pide el enlace a tu escuela.</p>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm font-semibold text-sea">Confían en ReservaTutti</p>
          <p className="mt-1 text-sm text-muted">Algunas escuelas que ya lo usan:</p>

          {schools.length === 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold text-sea">Aún no hay escuelas publicadas.</p>
              <p className="mt-1 text-sm text-muted">Si quieres probarlo, contacta conmigo.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {schools.map((s) => (
                <div key={s.id} className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-sm font-semibold text-sea">{s.name}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {isSuperAdmin ? (
          <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-sm font-semibold text-sea">Vista Super Admin</p>
            <p className="mt-1 text-sm text-muted">Explora escuelas y accede a herramientas de administración.</p>

            <div className="mt-4">
              <Link href="/superadmin" className="text-sm font-semibold text-brand-700">
                Ir a Super Admin
              </Link>
            </div>

            {schools.length > 0 ? (
              <div className="mt-4 space-y-2">
                {schools.map((s) => (
                  <div key={s.id} className="rounded-xl border border-border bg-background px-4 py-3">
                    <p className="text-sm font-semibold text-sea">{s.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/${s.slug}`}
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea"
                      >
                        Ver vista pública
                      </Link>
                      <Link
                        href={`/${s.slug}/admin`}
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea"
                      >
                        Ir al panel
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
