"use client";

import type { ByteOrder } from "@/lib/character-editor/types";

export interface ByteOrderSelectorProps {
  /** Current byte order */
  value: ByteOrder;
  /** Callback when byte order changes */
  onChange: (byteOrder: ByteOrder) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Reusable component for selecting byte order (Big/Little endian)
 * Only relevant for characters wider than 8 pixels (multi-byte rows)
 *
 * Used in:
 * - BinaryImportView (binary ROM import)
 * - ExportView (binary export)
 */
export function ByteOrderSelector({
  value,
  onChange,
  disabled = false,
  className = "",
}: ByteOrderSelectorProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onChange("big")}
        disabled={disabled}
        className={`
          flex-1 px-3 py-2 text-xs rounded border transition-colors
          ${
            value === "big"
              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
          }
          disabled:opacity-50
        `}
      >
        Big-Endian
      </button>
      <button
        type="button"
        onClick={() => onChange("little")}
        disabled={disabled}
        className={`
          flex-1 px-3 py-2 text-xs rounded border transition-colors
          ${
            value === "little"
              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
          }
          disabled:opacity-50
        `}
      >
        Little-Endian
      </button>
    </div>
  );
}

ByteOrderSelector.displayName = "ByteOrderSelector";
