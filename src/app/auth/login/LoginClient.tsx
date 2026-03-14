"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginClient({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().includes("@");
  }, [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });

      if (signInError) {
        setError("No se pudo enviar el enlace. Revisa el email e inténtalo de nuevo.");
        return;
      }

      setMessage("Te hemos enviado un enlace. Abre el email para entrar.");
    } catch {
      setError("No se pudo enviar el enlace. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Panel</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-sea">Entrar</h1>
        <p className="mt-2 text-sm text-muted">Te enviaremos un enlace para acceder al panel.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-sea">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
              placeholder="tu@escuela.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-coral/30 bg-coral/10 p-4 text-sm text-coral">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-xl border border-brand/30 bg-brand-50 p-4 text-sm text-brand-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || sending}
            className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
      </div>
    </main>
  );
}
