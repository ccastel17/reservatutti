"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
};

export function CopyToClipboardOnLoad({ text }: Props) {
  useEffect(() => {
    if (!text) return;

    const run = async () => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // ignore
      }
    };

    void run();
  }, [text]);

  return null;
}

export function CopyToClipboardButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="mt-2 inline-flex items-center justify-center rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-sea hover:bg-surface-2"
    >
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
