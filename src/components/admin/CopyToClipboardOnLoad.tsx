"use client";

import { useEffect } from "react";

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
