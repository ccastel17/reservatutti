"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = {
  key: string;
  label: string;
};

type Props = {
  value: string;
  options: Option[];
};

export function AdminTripsViewSelect({ value, options }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-sea shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="admin-trips-view" className="text-sm font-semibold text-sea">
          Ver
        </label>
        <select
          id="admin-trips-view"
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            const params = new URLSearchParams(searchParams?.toString());
            params.set("view", next);
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-sea outline-none focus:border-brand"
        >
          {options.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
