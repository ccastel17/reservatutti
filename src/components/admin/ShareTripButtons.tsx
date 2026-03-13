"use client";

import { useState } from "react";

type Props = {
  publicUrl: string;
  whatsappHref: string;
};

export function ShareTripButtons({ publicUrl, whatsappHref }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
      >
        Enviar por WhatsApp
      </a>

      <button
        type="button"
        onClick={onCopy}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
      >
        {copied ? "Copiado" : "Copiar link"}
      </button>
    </div>
  );
}
