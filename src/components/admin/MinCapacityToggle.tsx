"use client";

import { useState } from "react";

interface Props {
  defaultChecked?: boolean;
  defaultMinCapacity?: number | null;
  descriptionText?: string;
}

export function MinCapacityToggle({
  defaultChecked = false,
  defaultMinCapacity = null,
  descriptionText = "Si se marca, el evento mostrará el estado de confirmación y avisará en Actividad cuando se complete el cupo.",
}: Props) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <>
      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-4">
        <input
          type="checkbox"
          name="requiresMinCapacity"
          className="mt-1 h-4 w-4"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <div>
          <p className="text-sm font-semibold text-sea">Cupo mínimo requerido obligatorio</p>
          <p className="text-xs text-muted">{descriptionText}</p>
        </div>
      </label>

      {checked && (
        <div>
          <label className="block text-sm font-medium text-sea">Plazas mínimas</label>
          <input
            type="number"
            name="minCapacity"
            defaultValue={defaultMinCapacity ?? undefined}
            min={1}
            max={200}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea outline-none focus:border-brand"
            required
          />
        </div>
      )}
    </>
  );
}
