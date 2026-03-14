import { redirect } from "next/navigation";

async function goToSchool(formData: FormData) {
  "use server";

  const raw = String(formData.get("schoolSlug") ?? "").trim();
  const schoolSlug = raw.toLowerCase();

  if (!schoolSlug) {
    redirect("/");
  }

  redirect(`/${encodeURIComponent(schoolSlug)}`);
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-md flex-col px-4 py-10">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Reservatutti</p>
          <h1 className="text-3xl font-semibold tracking-tight text-sea">Encuentra tu escuela</h1>
          <p className="text-sm text-muted">
            Introduce el identificador de tu escuela para ver las salidas disponibles.
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <form action={goToSchool} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
              School slug
              <input
                name="schoolSlug"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="ej: garbinautic"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-sea shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Ver salidas
            </button>
          </form>

          <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-sm font-semibold text-sea">Ejemplo</p>
            <p className="mt-1 text-sm text-muted">reservatutti.vercel.app/garbinautic</p>
          </div>
        </section>
      </main>
    </div>
  );
}
