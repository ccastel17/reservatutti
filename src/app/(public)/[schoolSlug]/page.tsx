import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getSchoolBySlug } from "@/lib/data/schools";

type Props = {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ cat?: string }>;
};

export default async function PublicSchoolHomePage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const sp = await searchParams;

  if (sp.cat === "trip" || sp.cat === "theory" || sp.cat === "practice") {
    redirect(`/${schoolSlug}/salidas?cat=${sp.cat}`);
  }

  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{school.slug}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-sea">{school.name}</h1>
          <p className="text-sm text-muted">Elige qué quieres ver</p>
        </header>

        <section className="mt-6 space-y-3">
          <Link
            href={`/${schoolSlug}/salidas?cat=trip`}
            className="block rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
          >
            <p className="text-sm font-semibold text-sea">Salidas de Club</p>
            <p className="mt-1 text-sm text-muted">Ver próximas salidas publicadas</p>
          </Link>

          <Link
            href={`/${schoolSlug}/salidas?cat=practice`}
            className="block rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
          >
            <p className="text-sm font-semibold text-sea">Clases Prácticas</p>
            <p className="mt-1 text-sm text-muted">Ver próximas clases prácticas</p>
          </Link>

          <Link
            href={`/${schoolSlug}/salidas?cat=theory`}
            className="block rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
          >
            <p className="text-sm font-semibold text-sea">Clases Teóricas</p>
            <p className="mt-1 text-sm text-muted">Ver próximas clases teóricas</p>
          </Link>
        </section>

      <footer className="mt-8">
        <Link href={`/${schoolSlug}/admin`} className="text-sm font-semibold text-muted">
          Acceso organizadores
        </Link>
      </footer>
      </main>
    </div>
  );
}
