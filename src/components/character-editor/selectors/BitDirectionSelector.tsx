"use client";

import type { BitDirection } from "@/lib/character-editor/types";

export interface BitDirectionSelectorProps {
  /** Current bit direction */
  value: BitDirection;
  /** Callback when direction changes */
  onChange: (direction: BitDirection) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Reusable component for selecting bit direction (MSB/LSB first)
 * Consistent styling across all import/export views
 *
 * Used in:
 * - ImportConfigForm (binary ROM import)
 * - ImportFromTextModal (character import from code)
 * - ExportView (binary export)
 */
export function BitDirectionSelector({
  value,
  onChange,
  disabled = false,
  className = "",
}: BitDirectionSelectorProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onChange("msb")}
        disabled={disabled}
        className={`
          flex-1 px-3 py-2 text-xs rounded border transition-colors
          ${
            value === "msb"
              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
          }
          disabled:opacity-50
        `}
      >
        MSB First
      </button>
      <button
        type="button"
        onClick={() => onChange("lsb")}
        disabled={disabled}
        className={`
          flex-1 px-3 py-2 text-xs rounded border transition-colors
          ${
            value === "lsb"
              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
          }
          disabled:opacity-50
        `}
      >
        LSB First
      </button>
    </div>
  );
}
