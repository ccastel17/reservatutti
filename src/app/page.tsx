import Link from "next/link";
import { getAllSchools } from "@/lib/data/schools";

export default async function Home() {
  const schools = await getAllSchools();

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-md flex-col px-4 py-10">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Reservatutti</p>
          <h1 className="text-3xl font-semibold tracking-tight text-sea">Encuentra tu escuela</h1>
          <p className="text-sm text-muted">Selecciona tu escuela para ver las salidas disponibles.</p>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          {schools.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold text-sea">No hay escuelas disponibles.</p>
              <p className="mt-1 text-sm text-muted">Contacta con el organizador.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schools.map((s) => (
                <Link
                  key={s.id}
                  href={`/${s.slug}`}
                  className="block rounded-xl border border-border bg-background px-4 py-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                >
                  <p className="text-base font-semibold text-sea">{s.name}</p>
                  <p className="mt-1 text-sm text-muted">/{s.slug}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
