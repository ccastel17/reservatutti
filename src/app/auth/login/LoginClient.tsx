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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Entrar</h1>
        <p className="mt-2 text-sm text-slate-700">Te enviaremos un enlace para acceder al panel.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
              placeholder="tu@escuela.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || sending}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
      </div>
    </main>
  );
}
