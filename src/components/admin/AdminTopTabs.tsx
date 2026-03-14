"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  schoolSlug: string;
};

export function AdminTopTabs({ schoolSlug }: Props) {
  const pathname = usePathname();
  const inAdmin = pathname?.includes(`/${schoolSlug}/admin`);

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-1">
      <div className="grid grid-cols-2 gap-1">
        <Link
          href={`/${schoolSlug}/admin`}
          className={
            inAdmin
              ? "rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold text-sea shadow-sm"
              : "rounded-xl px-3 py-2 text-center text-sm font-semibold text-muted hover:text-sea"
          }
        >
          Panel
        </Link>
        <Link
          href={`/${schoolSlug}`}
          className={
            !inAdmin
              ? "rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold text-sea shadow-sm"
              : "rounded-xl px-3 py-2 text-center text-sm font-semibold text-muted hover:text-sea"
          }
        >
          Público
        </Link>
      </div>
    </div>
  );
}
