"use client";

import { useState, useCallback, useMemo } from "react";
import { AnchorPoint, Character, CharacterSetConfig, scaleCharacter, ScaleAlgorithm } from "@/lib/character-editor";
import { CharacterDisplay } from "./CharacterDisplay";

export interface ScaleModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when scale is applied */
  onScale: (scale: number, anchor: AnchorPoint, algorithm: ScaleAlgorithm) => void;
  /** All characters in the set */
  characters: Character[];
  /** Currently selected character indices */
  selectedIndices: Set<number>;
  /** Character set configuration */
  config: CharacterSetConfig;
  /** Foreground color for preview */
  foregroundColor?: string;
  /** Background color for preview */
  backgroundColor?: string;
}

// Scale factor presets
const SCALE_PRESETS = [
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2 },
  { label: "3x", value: 3 },
  { label: "4x", value: 4 },
];

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

// Algorithm options
const ALGORITHM_OPTIONS: { id: ScaleAlgorithm; label: string; description: string }[] = [
  { id: "nearest", label: "Nearest Neighbor", description: "Fast, sharp edges" },
  { id: "threshold", label: "Threshold-based", description: "Smoother, considers pixel coverage" },
];

/**
 * Modal for scaling characters with preview and options
 */
export function ScaleModal({
  isOpen,
  onClose,
  onScale,
  characters,
  selectedIndices,
  config,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
}: ScaleModalProps) {
  const [scale, setScale] = useState<number>(2);
  const [anchor, setAnchor] = useState<AnchorPoint>("mc");
  const [algorithm, setAlgorithm] = useState<ScaleAlgorithm>("nearest");

  // Get selected characters
  const selectedCharacters = useMemo(() => {
    return Array.from(selectedIndices)
      .slice(0, 16) // Limit preview to 16 characters
      .map((index) => characters[index])
      .filter((char): char is Character => char !== undefined);
  }, [characters, selectedIndices]);

  // Compute scaled preview characters
  const scaledCharacters = useMemo(() => {
    return selectedCharacters.map((char) =>
      scaleCharacter(char, scale, anchor, algorithm)
    );
  }, [selectedCharacters, scale, anchor, algorithm]);

  const remainingCount = Math.max(0, selectedIndices.size - 16);

  // Apply scale
  const handleApply = useCallback(() => {
    onScale(scale, anchor, algorithm);
    onClose();
  }, [scale, anchor, algorithm, onScale, onClose]);

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

  // Calculate preview grid dimensions
  const previewColumns = Math.min(4, selectedCharacters.length);
  const previewScale = 2; // Scale for preview thumbnails

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
      <div className="relative w-full max-w-lg bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Scale Characters</h2>

        {/* Preview section */}
        <div className="mb-6">
          <div className="flex gap-4">
            {/* Before preview */}
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-2">Before</label>
              <div
                className="bg-retro-dark rounded border border-retro-grid/30 p-2 min-h-[80px] flex items-center justify-center"
              >
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${previewColumns}, ${config.width * previewScale}px)`,
                  }}
                >
                  {selectedCharacters.map((char, index) => (
                    <CharacterDisplay
                      key={index}
                      character={char}
                      mode="small"
                      smallScale={previewScale}
                      foregroundColor={foregroundColor}
                      backgroundColor={backgroundColor}
                      interactive={false}
                    />
                  ))}
                </div>
              </div>
              {remainingCount > 0 && (
                <p className="text-[10px] text-gray-500 mt-1 text-center">
                  +{remainingCount} more
                </p>
              )}
            </div>

            {/* After preview */}
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-2">After</label>
              <div
                className="bg-retro-dark rounded border border-retro-grid/30 p-2 min-h-[80px] flex items-center justify-center"
              >
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${previewColumns}, ${config.width * previewScale}px)`,
                  }}
                >
                  {scaledCharacters.map((char, index) => (
                    <CharacterDisplay
                      key={index}
                      character={char}
                      mode="small"
                      smallScale={previewScale}
                      foregroundColor={foregroundColor}
                      backgroundColor={backgroundColor}
                      interactive={false}
                    />
                  ))}
                </div>
              </div>
              {remainingCount > 0 && (
                <p className="text-[10px] text-gray-500 mt-1 text-center">
                  +{remainingCount} more
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Scale factor selection */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Scale Factor</label>
          <div className="flex flex-wrap gap-2 items-center">
            {SCALE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setScale(preset.value)}
                className={`
                  px-3 py-1.5 text-sm rounded border transition-all
                  ${scale === preset.value
                    ? "border-retro-cyan bg-retro-cyan/20 text-retro-cyan"
                    : "border-retro-grid/50 bg-retro-dark text-gray-400 hover:border-retro-grid hover:text-white"
                  }
                `}
              >
                {preset.label}
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs text-gray-500">or</span>
              <input
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                value={scale}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > 0 && value <= 10) {
                    setScale(Math.round(value * 100) / 100); // Round to 2 decimal places
                  }
                }}
                className="w-20 px-2 py-1.5 text-sm bg-retro-dark border border-retro-grid/50 rounded text-white text-center focus:outline-none focus:border-retro-cyan"
              />
              <span className="text-xs text-gray-500">x</span>
            </div>
          </div>
        </div>

        {/* Anchor position grid */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">
            Anchor Position
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Select where to anchor content when scaling
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

        {/* Algorithm selection */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Algorithm</label>
          <div className="flex gap-2">
            {ALGORITHM_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setAlgorithm(option.id)}
                className={`
                  flex-1 px-3 py-2 text-sm rounded border transition-all text-left
                  ${algorithm === option.id
                    ? "border-retro-cyan bg-retro-cyan/20 text-retro-cyan"
                    : "border-retro-grid/50 bg-retro-dark text-gray-400 hover:border-retro-grid hover:text-white"
                  }
                `}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Info text */}
        <p className="text-xs text-gray-500 mb-4 text-center h-4">
          {scale > 1
            ? "Content will be enlarged and clipped to fit"
            : scale < 1
            ? "Content will be reduced"
            : "No scaling applied"}
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
            disabled={scale === 1 || scale <= 0 || scale > 10}
            className="flex-1 px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
