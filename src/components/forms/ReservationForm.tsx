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
        <label className="block text-sm font-medium text-sea">Tu nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
          placeholder="Ej. Carlos"
          autoComplete="name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-sea">Tu teléfono</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
          placeholder="Ej. 600 111 222"
          inputMode="tel"
          autoComplete="tel"
        />
        <p className="mt-2 text-xs text-muted">Lo usamos solo para gestionar la lista de inscritos.</p>
      </div>

      {isFrequent ? (
        <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-4">
          <input
            type="checkbox"
            checked={hasPlusOne}
            onChange={(e) => setHasPlusOne(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <div>
            <p className="text-sm font-semibold text-sea">Voy con acompañante (+1)</p>
            <p className="text-xs text-muted">Ocuparás dos plazas.</p>
          </div>
        </label>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-coral/30 bg-coral/10 p-4 text-sm text-coral">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit || props.spotsLeft <= 0}
        className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {props.spotsLeft <= 0 ? "Plazas agotadas" : submitting ? "Apuntándote…" : "Apuntarme"}
      </button>

      <p className="text-xs text-muted">
        Al apuntarte aceptas que la escuela use tu contacto para organizar la salida.
      </p>
    </form>
  );
}
