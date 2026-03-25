"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type ContactSuggestion = {
  id: string;
  fullName: string;
  phoneE164: string;
};

export function ContactAgendaNameAutocomplete(props: {
  schoolSlug: string;
  contactIdInputName: string;
  nameInputName: string;
  phoneInputName: string;
  namePlaceholder?: string;
  phonePlaceholder?: string;
}) {
  const nameId = useId();
  const phoneId = useId();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [picked, setPicked] = useState<ContactSuggestion | null>(null);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ContactSuggestion[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const minChars = 2;

  const showQuery = useMemo(() => {
    if (picked) return picked.fullName;
    return name;
  }, [name, picked]);

  useEffect(() => {
    if (picked) return;

    const q = query.trim();
    if (q.length < minChars) {
      setResults([]);
      setOpen(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setOpen(true);

    const handle = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/${encodeURIComponent(props.schoolSlug)}/contacts/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          setError("No se pudo buscar en la agenda.");
          setResults([]);
          setLoading(false);
          return;
        }

        const json = (await res.json().catch(() => null)) as { contacts?: ContactSuggestion[] } | null;
        setResults(json?.contacts ?? []);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("No se pudo buscar en la agenda.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [query, picked, props.schoolSlug]);

  const pick = (c: ContactSuggestion) => {
    setPicked(c);
    setName(c.fullName);
    setPhone(c.phoneE164);
    setOpen(false);
    setResults([]);
    setError(null);
  };

  const clearPick = () => {
    setPicked(null);
    setResults([]);
    setOpen(false);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name={props.contactIdInputName} value={picked?.id ?? ""} />

      <div className="relative">
        <label htmlFor={nameId} className="block text-xs font-medium text-muted">
          Nombre y Apellido/s
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id={nameId}
            name={props.nameInputName}
            value={showQuery}
            onChange={(e) => {
              setPicked(null);
              const value = e.target.value;
              setName(value);
              setQuery(value);
            }}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-sea placeholder:text-muted outline-none focus:border-brand"
            placeholder={props.namePlaceholder ?? "Ej. Marta López"}
            autoComplete="off"
          />

          {picked ? (
            <button
              type="button"
              onClick={clearPick}
              className="shrink-0 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-sea shadow-sm"
            >
              Quitar
            </button>
          ) : null}
        </div>

        {open ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
            <div className="p-2">
              {loading ? <p className="px-2 py-2 text-xs text-muted">Buscando…</p> : null}
              {error ? <p className="px-2 py-2 text-xs text-coral">{error}</p> : null}

              {!loading && !error && results.length === 0 ? (
                <p className="px-2 py-2 text-xs text-muted">
                  Sin resultados. Completa el teléfono para añadirlo manualmente.
                </p>
              ) : null}

              {!error ? (
                <ul className="max-h-56 overflow-auto">
                  {results.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => pick(c)}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-sea hover:bg-surface-2"
                      >
                        <p className="text-sm font-semibold">{c.fullName}</p>
                        <p className="text-xs text-muted">{c.phoneE164}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}

        <p className="mt-1 text-xs text-muted">
          Escribe el nombre para ver sugerencias de la agenda. Al seleccionar, se completa el teléfono.
        </p>
      </div>

      <div>
        <label htmlFor={phoneId} className="block text-xs font-medium text-muted">
          Teléfono
        </label>
        <input
          id={phoneId}
          name={props.phoneInputName}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-sea placeholder:text-muted outline-none focus:border-brand"
          placeholder={props.phonePlaceholder ?? "Ej. 600 111 222"}
          inputMode="tel"
        />
      </div>
    </div>
  );
}
