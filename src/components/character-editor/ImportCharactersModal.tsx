"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { LibraryCardCompact } from "./LibraryCard";
import { CharacterDisplay } from "./CharacterDisplay";
import { useCharacterLibrary } from "@/hooks/character-editor";
import {
  SerializedCharacterSet,
  CharacterSetConfig,
  Character,
  AnchorPoint,
} from "@/lib/character-editor/types";
import { deserializeCharacterSet } from "@/lib/character-editor/binary";
import { resizeCharacter } from "@/lib/character-editor/transforms";
import { formatSize } from "@/lib/character-editor/utils";

// 3x3 anchor grid
const ANCHOR_POSITIONS: AnchorPoint[] = [
  "tl", "tc", "tr",
  "ml", "mc", "mr",
  "bl", "bc", "br",
];

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

export interface ImportCharactersModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Current character set config (for dimension comparison) */
  currentConfig: CharacterSetConfig;
  /** Callback when characters are imported */
  onImport: (characters: Character[]) => void;
}

type Step = "select-set" | "select-chars" | "resize";

/**
 * Modal for importing characters from another character set in the library
 */
export function ImportCharactersModal({
  isOpen,
  onClose,
  currentConfig,
  onImport,
}: ImportCharactersModalProps) {
  const { characterSets, loading } = useCharacterLibrary();

  // Current step
  const [step, setStep] = useState<Step>("select-set");

  // Step 1: Selected source set
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Step 2: Selected character indices
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  // Step 3: Anchor point
  const [anchor, setAnchor] = useState<AnchorPoint>("tl");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional reset when modal closes
      setStep("select-set");
      setSelectedSetId(null);
      setSearchQuery("");
      setSelectedIndices(new Set());
      setLastClickedIndex(null);
      setAnchor("tl");
    }
  }, [isOpen]);

  // Get selected source set and characters
  const selectedSet = useMemo(() => {
    if (!selectedSetId) return null;
    return characterSets.find((s) => s.metadata.id === selectedSetId) || null;
  }, [characterSets, selectedSetId]);

  const sourceCharacters = useMemo(() => {
    if (!selectedSet) return [];
    try {
      const deserialized = deserializeCharacterSet(selectedSet);
      return deserialized.characters;
    } catch {
      return [];
    }
  }, [selectedSet]);

  // Check if dimensions differ
  const dimensionsDiffer = useMemo(() => {
    if (!selectedSet) return false;
    return (
      currentConfig.width !== selectedSet.config.width ||
      currentConfig.height !== selectedSet.config.height
    );
  }, [selectedSet, currentConfig]);

  // Filter character sets
  const filteredSets = useMemo(() => {
    if (!searchQuery.trim()) return characterSets;
    const query = searchQuery.toLowerCase();
    return characterSets.filter(
      (set) =>
        set.metadata.name.toLowerCase().includes(query) ||
        set.metadata.description.toLowerCase().includes(query)
    );
  }, [characterSets, searchQuery]);

  // Handlers
  const handleSelectSet = useCallback((set: SerializedCharacterSet) => {
    setSelectedSetId(set.metadata.id);
  }, []);

  const handleCharacterClick = useCallback(
    (index: number, shiftKey: boolean, ctrlKey: boolean) => {
      setSelectedIndices((prev) => {
        const next = new Set(prev);

        if (shiftKey && lastClickedIndex !== null) {
          // Range select
          const start = Math.min(lastClickedIndex, index);
          const end = Math.max(lastClickedIndex, index);
          for (let i = start; i <= end; i++) {
            next.add(i);
          }
        } else if (ctrlKey) {
          // Toggle single
          if (next.has(index)) {
            next.delete(index);
          } else {
            next.add(index);
          }
        } else {
          // Single select (clear others)
          next.clear();
          next.add(index);
        }

        return next;
      });
      setLastClickedIndex(index);
    },
    [lastClickedIndex]
  );

  const handleSelectAll = useCallback(() => {
    setSelectedIndices(new Set(sourceCharacters.map((_, i) => i)));
  }, [sourceCharacters]);

  const handleSelectNone = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const handleBack = useCallback(() => {
    if (step === "resize") {
      setStep("select-chars");
    } else if (step === "select-chars") {
      setStep("select-set");
      setSelectedIndices(new Set());
    }
  }, [step]);

  const handleNext = useCallback(() => {
    if (step === "select-set" && selectedSetId) {
      setStep("select-chars");
    } else if (step === "select-chars" && selectedIndices.size > 0) {
      if (dimensionsDiffer) {
        setStep("resize");
      } else {
        // Import directly
        const charsToImport = Array.from(selectedIndices)
          .sort((a, b) => a - b)
          .map((i) => sourceCharacters[i]);
        onImport(charsToImport);
        onClose();
      }
    }
  }, [step, selectedSetId, selectedIndices, dimensionsDiffer, sourceCharacters, onImport, onClose]);

  const handleImport = useCallback(() => {
    const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
    let charsToImport = sortedIndices.map((i) => sourceCharacters[i]);

    // Resize if needed
    if (dimensionsDiffer) {
      charsToImport = charsToImport.map((char) =>
        resizeCharacter(char, currentConfig.width, currentConfig.height, anchor)
      );
    }

    onImport(charsToImport);
    onClose();
  }, [selectedIndices, sourceCharacters, dimensionsDiffer, currentConfig, anchor, onImport, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

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
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-retro-grid/30">
          <h2 className="text-lg font-medium text-white">Import Characters</h2>
          <p className="text-xs text-gray-500 mt-1">
            {step === "select-set" && "Select a character set to import from"}
            {step === "select-chars" && `Select characters to import (${selectedIndices.size} selected)`}
            {step === "resize" && "Configure resize settings"}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
          {/* Step 1: Select Set */}
          {step === "select-set" && (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {/* Search */}
              <div className="relative flex-shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 pl-9 bg-retro-dark border border-retro-grid/50 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Set list */}
              <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : filteredSets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No character sets found</div>
                ) : (
                  filteredSets.map((set) => (
                    <LibraryCardCompact
                      key={set.metadata.id}
                      characterSet={set}
                      selected={selectedSetId === set.metadata.id}
                      onClick={() => handleSelectSet(set)}
                    />
                  ))
                )}
              </div>

              {/* Dimension info */}
              {selectedSet && (
                <div className="flex-shrink-0 text-xs text-gray-500 text-center pt-2 border-t border-retro-grid/30">
                  Source: {formatSize(selectedSet.config)} ({sourceCharacters.length} chars)
                  {dimensionsDiffer && (
                    <span className="text-yellow-500 ml-2">
                      (will be resized to {formatSize(currentConfig)})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Characters */}
          {step === "select-chars" && selectedSet && (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {/* Selection controls */}
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="text-xs text-gray-500">
                  Click to select, Shift+click for range, Ctrl+click to toggle
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-retro-cyan hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleSelectNone}
                    className="text-xs text-gray-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Character grid */}
              <div className="bg-black/30 rounded-lg p-3 flex-1 overflow-y-auto min-h-0">
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(selectedSet.config.width * 3, 24) + 8}px, 1fr))`,
                  }}
                >
                  {sourceCharacters.map((char, index) => {
                    const isSelected = selectedIndices.has(index);
                    return (
                      <button
                        key={index}
                        onClick={(e) => handleCharacterClick(index, e.shiftKey, e.ctrlKey || e.metaKey)}
                        className={`
                          p-1 rounded border-2 transition-all
                          ${isSelected
                            ? "border-retro-cyan bg-retro-cyan/20"
                            : "border-transparent hover:border-retro-grid/50"
                          }
                        `}
                        title={`Character ${index}`}
                      >
                        <CharacterDisplay
                          character={char}
                          mode="small"
                          smallScale={3}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Resize */}
          {step === "resize" && selectedSet && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-300 mb-2">
                  Source dimensions differ from target
                </p>
                <p className="text-xs text-gray-500">
                  {formatSize(selectedSet.config)} → {formatSize(currentConfig)}
                </p>
              </div>

              {/* Anchor selection */}
              <div>
                <label className="block text-sm text-gray-300 mb-2 text-center">
                  Anchor Position
                </label>
                <p className="text-xs text-gray-500 mb-3 text-center">
                  Select where to anchor content when resizing
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

              <p className="text-xs text-gray-500 text-center">
                {selectedIndices.size} character{selectedIndices.size !== 1 ? "s" : ""} will be imported and resized
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-retro-grid/30 flex justify-between">
          {step === "select-set" ? (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
            >
              Back
            </button>
          )}

          {step === "resize" ? (
            <button
              onClick={handleImport}
              className="px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors"
            >
              Import ({selectedIndices.size})
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                (step === "select-set" && !selectedSetId) ||
                (step === "select-chars" && selectedIndices.size === 0)
              }
              className="px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === "select-chars" && !dimensionsDiffer
                ? `Import (${selectedIndices.size})`
                : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
