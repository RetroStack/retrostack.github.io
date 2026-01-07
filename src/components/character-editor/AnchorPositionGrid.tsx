"use client";

import { AnchorPoint } from "@/lib/character-editor/types";
import { getAnchorPositions, getAnchorPositionLabel } from "@/lib/character-editor/presets";

export interface AnchorPositionGridProps {
  /** Currently selected anchor position */
  value: AnchorPoint;
  /** Callback when anchor position changes */
  onChange: (anchor: AnchorPoint) => void;
  /** Optional label text */
  label?: string;
  /** Optional description text */
  description?: string;
}

// Get anchor positions from centralized presets
const ANCHOR_POSITIONS = getAnchorPositions();

/**
 * 3x3 grid for selecting anchor positions
 * Used for resize and scale operations
 */
export function AnchorPositionGrid({
  value,
  onChange,
  label = "Anchor Position",
  description,
}: AnchorPositionGridProps) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-2">{label}</label>
      {description && (
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      )}
      <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
        {ANCHOR_POSITIONS.map((pos) => {
          const isSelected = value === pos;
          return (
            <button
              key={pos}
              type="button"
              onClick={() => onChange(pos)}
              className={`
                w-10 h-10 rounded border-2 transition-all
                flex items-center justify-center
                ${isSelected
                  ? "border-retro-amber bg-retro-amber/20"
                  : "border-retro-grid/50 bg-retro-dark hover:border-retro-grid"
                }
              `}
              title={getAnchorPositionLabel(pos)}
            >
              <div
                className={`
                  w-3 h-3 rounded-sm transition-colors
                  ${isSelected ? "bg-retro-amber" : "bg-gray-600"}
                `}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
