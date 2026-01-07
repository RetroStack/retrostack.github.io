"use client";

import { useState, useCallback, useEffect } from "react";
import { CharacterSet, Character } from "@/lib/character-editor/types";
import { CharacterDisplay } from "./CharacterDisplay";

export interface CharacterPickerModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The character set to pick from */
  sourceSet: CharacterSet | null;
  /** Callback when characters are selected for import */
  onImportCharacters: (characters: Character[], sourceSetName: string) => void;
  /** Maximum characters that can be selected (0 = unlimited) */
  maxSelection?: number;
}

/**
 * Modal for picking individual characters from a character set
 */
export function CharacterPickerModal({
  isOpen,
  onClose,
  sourceSet,
  onImportCharacters,
  maxSelection = 0,
}: CharacterPickerModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [selectionMode] = useState<"single" | "range">("single");
  const [rangeStart, setRangeStart] = useState<number | null>(null);

  // Reset selection when source changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional reset when source changes
    setSelectedIndices(new Set());
    setRangeStart(null);
  }, [sourceSet?.metadata.id]);

  const handleCharacterClick = useCallback(
    (index: number, event: React.MouseEvent) => {
      if (selectionMode === "range" && event.shiftKey && rangeStart !== null) {
        // Range selection
        const start = Math.min(rangeStart, index);
        const end = Math.max(rangeStart, index);
        const newSelection = new Set(selectedIndices);

        for (let i = start; i <= end; i++) {
          if (maxSelection === 0 || newSelection.size < maxSelection) {
            newSelection.add(i);
          }
        }

        setSelectedIndices(newSelection);
      } else if (event.ctrlKey || event.metaKey) {
        // Toggle selection
        const newSelection = new Set(selectedIndices);
        if (newSelection.has(index)) {
          newSelection.delete(index);
        } else if (maxSelection === 0 || newSelection.size < maxSelection) {
          newSelection.add(index);
        }
        setSelectedIndices(newSelection);
        setRangeStart(index);
      } else {
        // Single selection (toggle)
        const newSelection = new Set(selectedIndices);
        if (newSelection.has(index)) {
          newSelection.delete(index);
        } else if (maxSelection === 0 || newSelection.size < maxSelection) {
          newSelection.add(index);
        }
        setSelectedIndices(newSelection);
        setRangeStart(index);
      }
    },
    [selectionMode, rangeStart, selectedIndices, maxSelection]
  );

  const handleSelectAll = useCallback(() => {
    if (!sourceSet) return;
    const max = maxSelection > 0 ? maxSelection : sourceSet.characters.length;
    const newSelection = new Set<number>();
    for (let i = 0; i < Math.min(sourceSet.characters.length, max); i++) {
      newSelection.add(i);
    }
    setSelectedIndices(newSelection);
  }, [sourceSet, maxSelection]);

  const handleSelectNone = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const handleImport = useCallback(() => {
    if (!sourceSet || selectedIndices.size === 0) return;

    const selectedCharacters = Array.from(selectedIndices)
      .sort((a, b) => a - b)
      .map((index) => sourceSet.characters[index]);

    onImportCharacters(selectedCharacters, sourceSet.metadata.name);
    onClose();
  }, [sourceSet, selectedIndices, onImportCharacters, onClose]);

  const handleClose = useCallback(() => {
    setSelectedIndices(new Set());
    setRangeStart(null);
    onClose();
  }, [onClose]);

  if (!isOpen || !sourceSet) return null;

  const { config, characters } = sourceSet;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-retro-dark border border-retro-grid/50 rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-retro-grid/30">
          <div>
            <h2 className="text-lg font-medium text-white">
              Pick Characters
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              from {sourceSet.metadata.name}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selection toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-retro-grid/30 bg-retro-navy/30">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Select All
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={handleSelectNone}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Select None
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>
              {selectedIndices.size} selected
              {maxSelection > 0 && ` (max ${maxSelection})`}
            </span>
            <span className="text-gray-600">|</span>
            <span>Hold Shift for range, Cmd/Ctrl to toggle</span>
          </div>
        </div>

        {/* Character grid */}
        <div className="flex-1 overflow-auto p-4">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(config.width * 3, 32)}px, 1fr))`,
            }}
          >
            {characters.map((character, index) => (
              <button
                key={index}
                onClick={(e) => handleCharacterClick(index, e)}
                className={`
                  relative p-1 rounded transition-all
                  ${
                    selectedIndices.has(index)
                      ? "bg-retro-cyan/30 ring-2 ring-retro-cyan"
                      : "bg-black/30 hover:bg-black/50"
                  }
                `}
                title={`Character ${index}${index >= 32 && index <= 126 ? ` = '${String.fromCharCode(index)}'` : ""}`}
              >
                <CharacterDisplay
                  character={character}
                  mode="small"
                  smallScale={3}
                  foregroundColor="#00ffff"
                  backgroundColor="transparent"
                  interactive={false}
                />

                {/* Selection indicator */}
                {selectedIndices.has(index) && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-retro-cyan rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-retro-dark" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                )}

                {/* Index label */}
                <div className="absolute bottom-0 left-0 right-0 text-center">
                  <span className="text-[8px] text-gray-600">{index}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-retro-grid/30">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleImport}
            disabled={selectedIndices.size === 0}
            className="px-6 py-2 text-sm bg-retro-pink/20 text-retro-pink border border-retro-pink rounded-lg hover:bg-retro-pink/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {selectedIndices.size} Character{selectedIndices.size !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
