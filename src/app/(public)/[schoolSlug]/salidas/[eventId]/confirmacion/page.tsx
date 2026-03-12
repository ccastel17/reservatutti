import Link from "next/link";

type Props = {
  params: Promise<{ schoolSlug: string; eventId: string }>;
  searchParams: Promise<{ booking?: string }>;
};

export default async function BookingConfirmationPage({ params, searchParams }: Props) {
  const { schoolSlug, eventId } = await params;
  const { booking } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">¡Listo! Estás apuntado</h1>
        <p className="mt-2 text-sm text-slate-700">
          Si hay algún cambio, la escuela contactará contigo por teléfono.
        </p>

        {booking ? (
          <p className="mt-4 text-xs text-slate-500">Referencia: {booking}</p>
        ) : null}

        <div className="mt-6">
          <Link
            href={`/${schoolSlug}/salidas/${eventId}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white"
          >
            Ver la salida
          </Link>
        </div>

        <div className="mt-3">
          <Link
            href={`/${schoolSlug}`}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-900"
          >
            Volver a salidas
          </Link>
        </div>
      </div>
    </main>
  );
}
