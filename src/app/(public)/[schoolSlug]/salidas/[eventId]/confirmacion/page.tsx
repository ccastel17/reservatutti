import Link from "next/link";

type Props = {
  params: Promise<{ schoolSlug: string; eventId: string }>;
  searchParams: Promise<{ booking?: string }>;
};

export default async function BookingConfirmationPage({ params, searchParams }: Props) {
  const { schoolSlug, eventId } = await params;
  const { booking } = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight text-sea">¡Listo! Estás apuntado</h1>
          <p className="mt-2 text-sm text-muted">
            Si hay algún cambio, la escuela contactará contigo por teléfono.
          </p>

          {booking ? <p className="mt-4 text-xs text-muted">Referencia: {booking}</p> : null}

          <div className="mt-6">
            <Link
              href={`/${schoolSlug}/salidas/${eventId}`}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-sm"
            >
              Ver la salida
            </Link>
          </div>

          <div className="mt-3">
            <Link
              href={`/${schoolSlug}`}
              className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-4 py-3 text-base font-semibold text-sea shadow-sm"
            >
              Volver a salidas
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
