"use client";

import { useState, useCallback } from "react";
import { AnchorPoint } from "@/lib/character-editor/types";
import { AnchorPositionGrid } from "./AnchorPositionGrid";

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
          <AnchorPositionGrid
            value={anchor}
            onChange={setAnchor}
            description="Select where to anchor existing content when resizing"
          />
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
