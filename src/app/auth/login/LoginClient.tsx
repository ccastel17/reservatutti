"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginClient({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().includes("@");
  }, [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    setError(null);
    setErrorDetails(null);

    try {
      const supabase = getSupabaseBrowser();
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });

      if (signInError) {
        setError("No se pudo enviar el enlace. Revisa el email e inténtalo de nuevo.");
        setErrorDetails(`${signInError.message}${signInError.status ? ` (status ${signInError.status})` : ""}`);
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
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-700 via-sea to-sea" />
      <div className="absolute inset-0 bg-[url('/bg_home.JPG')] bg-cover bg-center opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/55" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-white/15 bg-white/85 p-6 shadow-lg backdrop-blur">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Panel</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-sea">Entrar</h1>
          <p className="mt-2 text-sm text-muted">Te enviaremos un enlace para acceder al panel.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-sea">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
                placeholder="tu@escuela.com"
                autoComplete="email"
                inputMode="email"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-coral/30 bg-coral/10 p-4 text-sm text-coral">
                {error}
                {errorDetails ? <p className="mt-2 text-xs text-coral/90">{errorDetails}</p> : null}
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
      </div>
    </main>
  );
}
