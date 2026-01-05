"use client";

import { useState, useCallback } from "react";
import { AnchorPoint } from "@/lib/character-editor";

export interface ResizeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Current width */
  currentWidth: number;
  /** Current height */
  currentHeight: number;
  /** Callback when resize is applied */
  onResize: (width: number, height: number, anchor: AnchorPoint) => void;
}

// 3x3 grid of anchor positions (row by row)
const ANCHOR_POSITIONS: AnchorPoint[] = [
  "tl", "tc", "tr",
  "ml", "mc", "mr",
  "bl", "bc", "br",
];

// Human-readable labels for anchor positions
function getAnchorLabel(anchor: AnchorPoint): string {
  const labels: Record<AnchorPoint, string> = {
    tl: "Top Left",
    tc: "Top Center",
    tr: "Top Right",
    ml: "Middle Left",
    mc: "Middle Center",
    mr: "Middle Right",
    bl: "Bottom Left",
    bc: "Bottom Center",
    br: "Bottom Right",
  };
  return labels[anchor];
}

/**
 * Modal for resizing character dimensions with anchor point selection
 */
export function ResizeModal({
  isOpen,
  onClose,
  currentWidth,
  currentHeight,
  onResize,
}: ResizeModalProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [anchor, setAnchor] = useState<AnchorPoint>("tl");

  // Reset to current values when modal opens
  const handleOpen = useCallback(() => {
    setWidth(currentWidth);
    setHeight(currentHeight);
    setAnchor("tl");
  }, [currentWidth, currentHeight]);

  // Apply resize
  const handleApply = useCallback(() => {
    if (width > 0 && height > 0) {
      onResize(width, height, anchor);
      onClose();
    }
  }, [width, height, anchor, onResize, onClose]);

  // Handle keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        handleApply();
      }
    },
    [onClose, handleApply]
  );

  if (!isOpen) return null;

  const hasChanges = width !== currentWidth || height !== currentHeight;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Resize Characters</h2>

        {/* Dimension inputs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Width</label>
            <input
              type="number"
              min={1}
              max={32}
              value={width}
              onChange={(e) => setWidth(Math.max(1, Math.min(32, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Height</label>
            <input
              type="number"
              min={1}
              max={32}
              value={height}
              onChange={(e) => setHeight(Math.max(1, Math.min(32, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
            />
          </div>
        </div>

        {/* Anchor position grid */}
        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-2">
            Anchor Position
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Select where to anchor existing content when resizing
          </p>
          <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
            {ANCHOR_POSITIONS.map((pos) => {
              const isSelected = anchor === pos;
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setAnchor(pos)}
                  className={`
                    w-10 h-10 rounded border-2 transition-all
                    flex items-center justify-center
                    ${isSelected
                      ? "border-retro-cyan bg-retro-cyan/20"
                      : "border-retro-grid/50 bg-retro-dark hover:border-retro-grid"
                    }
                  `}
                  title={getAnchorLabel(pos)}
                >
                  <div
                    className={`
                      w-3 h-3 rounded-sm transition-colors
                      ${isSelected ? "bg-retro-cyan" : "bg-gray-600"}
                    `}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Info text - always visible with consistent height */}
        <p className="text-xs text-gray-500 mb-4 text-center h-4">
          {!hasChanges
            ? "No changes"
            : width > currentWidth || height > currentHeight
            ? "New pixels will be added with background color"
            : width < currentWidth || height < currentHeight
            ? "Some pixels will be cropped"
            : "No changes"}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!hasChanges || width < 1 || height < 1}
            className="flex-1 px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
