"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  value: string;
};

export function AdminTripsCategorySelect({ value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-sea shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="admin-trips-cat" className="text-sm font-semibold text-sea">
          Tipo
        </label>
        <select
          id="admin-trips-cat"
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            const params = new URLSearchParams(searchParams?.toString());
            if (!next) params.delete("cat");
            else params.set("cat", next);
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-sea outline-none focus:border-brand"
        >
          <option value="">Todas</option>
          <option value="trip">Salidas</option>
          <option value="theory">Teóricas</option>
          <option value="practice">Prácticas</option>
        </select>
      </div>
    </div>
  );
}
