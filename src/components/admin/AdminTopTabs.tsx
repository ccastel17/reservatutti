"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  schoolSlug: string;
  activityUnreadCount: number;
};

export function AdminTopTabs({ schoolSlug, activityUnreadCount }: Props) {
  const pathname = usePathname();
  const adminBase = `/${schoolSlug}/admin`;
  const statsPath = `/${schoolSlug}/admin/stats`;
  const activityPath = `/${schoolSlug}/admin/actividad`;

  const inAdmin = pathname?.startsWith(adminBase);
  const inStats = pathname?.startsWith(statsPath);
  const inActivity = pathname?.startsWith(activityPath);

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-1">
      <div className="grid grid-cols-4 gap-1">
        <Link
          href={`/${schoolSlug}/admin`}
          className={
            inAdmin && !inStats && !inActivity
              ? "rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold text-sea shadow-sm"
              : "rounded-xl px-3 py-2 text-center text-sm font-semibold text-muted hover:text-sea"
          }
        >
          Panel
        </Link>
        <Link
          href={`/${schoolSlug}/admin/actividad`}
          className={
            inActivity
              ? "rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold text-sea shadow-sm"
              : "rounded-xl px-3 py-2 text-center text-sm font-semibold text-muted hover:text-sea"
          }
        >
          <span className="inline-flex items-center justify-center gap-2">
            Actividad
            {activityUnreadCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white">
                {activityUnreadCount}
              </span>
            ) : null}
          </span>
        </Link>
        <Link
          href={`/${schoolSlug}/admin/stats`}
          className={
            inStats
              ? "rounded-xl bg-surface px-3 py-2 text-center text-sm font-semibold text-sea shadow-sm"
              : "rounded-xl px-3 py-2 text-center text-sm font-semibold text-muted hover:text-sea"
          }
        >
          Stats
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
