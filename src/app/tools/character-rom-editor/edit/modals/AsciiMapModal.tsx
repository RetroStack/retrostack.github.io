"use client";

import { useCallback, useMemo } from "react";
import { Character } from "@/lib/character-editor/types";
import { isPrintableAscii, getControlCharInfo } from "@/lib/character-editor/data/ascii";

export interface AsciiMapModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** All characters in the set */
  characters: Character[];
  /** Currently selected character index */
  selectedIndex: number;
  /** Callback when character is selected */
  onSelect: (index: number) => void;
  /** Foreground color for rendering */
  foregroundColor?: string;
  /** Background color for rendering */
  backgroundColor?: string;
}

/**
 * Mini character preview (canvas-based for performance)
 */
function MiniCharacter({
  character,
  index,
  isSelected,
  onClick,
  foregroundColor,
  backgroundColor,
}: {
  character: Character;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  foregroundColor: string;
  backgroundColor: string;
}) {
  const height = character.pixels.length;
  const width = character.pixels[0]?.length || 0;
  const isPrintable = isPrintableAscii(index);
  const controlCharInfo = getControlCharInfo(index);

  // Calculate tooltip
  const tooltip = useMemo(() => {
    const parts = [
      `#${index}`,
      `0x${index.toString(16).toUpperCase().padStart(2, "0")}`,
    ];
    if (isPrintable) {
      parts.push(`'${String.fromCharCode(index)}'`);
    } else if (controlCharInfo) {
      parts.push(`${controlCharInfo.abbr} (${controlCharInfo.name})`);
    }
    return parts.join(" | ");
  }, [index, isPrintable, controlCharInfo]);

  return (
    <button
      onClick={onClick}
      className={`
        relative p-0.5 rounded transition-all
        hover:bg-retro-cyan/20 hover:ring-1 hover:ring-retro-cyan/50
        ${isSelected ? "bg-retro-cyan/30 ring-2 ring-retro-cyan" : ""}
      `}
      title={tooltip}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${width}, 2px)`,
          gridTemplateRows: `repeat(${height}, 2px)`,
          width: width * 2,
          height: height * 2,
        }}
      >
        {character.pixels.flat().map((isOn, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: isOn ? foregroundColor : backgroundColor,
              width: 2,
              height: 2,
            }}
          />
        ))}
      </div>
      {/* Hex code overlay on hover */}
      <span className="absolute inset-0 flex items-center justify-center text-[6px] font-mono text-white opacity-0 hover:opacity-100 bg-black/60 rounded">
        {index.toString(16).toUpperCase().padStart(2, "0")}
      </span>
    </button>
  );
}

/**
 * Modal showing all characters in a grid with their hex codes
 */
export function AsciiMapModal({
  isOpen,
  onClose,
  characters,
  selectedIndex,
  onSelect,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
}: AsciiMapModalProps) {
  // Handle keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Handle character click
  const handleCharacterClick = useCallback(
    (index: number) => {
      onSelect(index);
      onClose();
    },
    [onSelect, onClose]
  );

  // Calculate grid dimensions
  const gridCols = 16; // Standard 16 columns for hex display
  const rows = Math.ceil(characters.length / gridCols);

  if (!isOpen) return null;

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
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-retro-grid/30">
          <div>
            <h2 className="text-lg font-medium text-white">Character Map</h2>
            <p className="text-xs text-gray-400">
              {characters.length} characters • Click to select • Hover for details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Row headers (0x00, 0x10, 0x20, etc.) */}
        <div className="flex p-4 pb-0 gap-1">
          <div className="w-8" /> {/* Spacer for row labels */}
          <div className="flex gap-0.5">
            {Array.from({ length: gridCols }).map((_, col) => (
              <div
                key={col}
                className="w-[18px] text-center text-[8px] font-mono text-gray-500"
              >
                {col.toString(16).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Character grid */}
        <div className="flex-1 overflow-auto p-4 pt-2">
          <div className="flex flex-col gap-0.5">
            {Array.from({ length: rows }).map((_, row) => {
              const rowStart = row * gridCols;
              return (
                <div key={row} className="flex gap-1">
                  {/* Row label */}
                  <div className="w-8 flex items-center justify-end pr-1 text-[9px] font-mono text-gray-500">
                    {(row * gridCols).toString(16).toUpperCase().padStart(2, "0")}
                  </div>
                  {/* Characters in row */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: gridCols }).map((_, col) => {
                      const index = rowStart + col;
                      if (index >= characters.length) {
                        return (
                          <div
                            key={col}
                            className="w-[18px] h-[18px] bg-retro-dark/30 rounded"
                          />
                        );
                      }
                      return (
                        <MiniCharacter
                          key={col}
                          character={characters[index]}
                          index={index}
                          isSelected={index === selectedIndex}
                          onClick={() => handleCharacterClick(index)}
                          foregroundColor={foregroundColor}
                          backgroundColor={backgroundColor}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with legend */}
        <div className="p-3 border-t border-retro-grid/30 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-retro-cyan/30 ring-1 ring-retro-cyan" />
              <span>Selected</span>
            </span>
            <span>
              Current: #{selectedIndex} (0x{selectedIndex.toString(16).toUpperCase().padStart(2, "0")})
              {isPrintableAscii(selectedIndex) && (
                <span className="ml-1 text-retro-pink">
                  &apos;{String.fromCharCode(selectedIndex)}&apos;
                </span>
              )}
            </span>
          </div>
          <span className="font-mono">Press M to toggle</span>
        </div>
      </div>
    </div>
  );
}
