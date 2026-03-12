"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  schoolSlug: string;
  tripId: string;
  spotsLeft: number;
};

type ApiError = {
  error: string;
  code?: string;
};

export function ReservationForm(props: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isFrequent, setIsFrequent] = useState(false);
  const [hasPlusOne, setHasPlusOne] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && phone.trim().length >= 6 && !submitting;
  }, [name, phone, submitting]);

  useEffect(() => {
    setError(null);

    const trimmed = phone.trim();
    if (trimmed.length < 6) {
      setIsFrequent(false);
      setHasPlusOne(false);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ phone: trimmed });
        const res = await fetch(`/api/${props.schoolSlug}/contact-status?${params}`);
        if (!res.ok) {
          setIsFrequent(false);
          setHasPlusOne(false);
          return;
        }
        const data = (await res.json()) as { isFrequent: boolean };
        setIsFrequent(Boolean(data.isFrequent));
        if (!data.isFrequent) setHasPlusOne(false);
      } catch {
        setIsFrequent(false);
        setHasPlusOne(false);
      }
    }, 350);

    return () => clearTimeout(handle);
  }, [phone, props.schoolSlug]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/${props.schoolSlug}/reservas`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tripId: props.tripId,
          participantName: name,
          participantPhone: phone,
          hasPlusOne,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as ApiError | null;
        setError(data?.error ?? "No se pudo completar la reserva.");
        return;
      }

      const data = (await res.json()) as { bookingId: string };
      window.location.href = `/${props.schoolSlug}/salidas/${props.tripId}/confirmacion?booking=${encodeURIComponent(
        data.bookingId
      )}`;
    } catch {
      setError("No se pudo completar la reserva. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Tu nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
          placeholder="Ej. Carlos"
          autoComplete="name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Tu teléfono</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
          placeholder="Ej. 600 111 222"
          inputMode="tel"
          autoComplete="tel"
        />
        <p className="mt-2 text-xs text-slate-500">Lo usamos solo para gestionar la lista de inscritos.</p>
      </div>

      {isFrequent ? (
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={hasPlusOne}
            onChange={(e) => setHasPlusOne(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">Voy con acompañante (+1)</p>
            <p className="text-xs text-slate-600">Ocuparás dos plazas.</p>
          </div>
        </label>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit || props.spotsLeft <= 0}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {props.spotsLeft <= 0 ? "Plazas agotadas" : submitting ? "Apuntándote…" : "Apuntarme"}
      </button>

      <p className="text-xs text-slate-500">
        Al apuntarte aceptas que la escuela use tu contacto para organizar la salida.
      </p>
    </form>
  );
}
