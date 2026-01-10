"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { LibraryCardCompact } from "@/components/character-editor/library/LibraryCard";
import { CharacterDisplay } from "@/components/character-editor/character/CharacterDisplay";
import { useCharacterLibrary } from "@/hooks/character-editor/useCharacterLibrary";
import { SerializedCharacterSet, CharacterSetConfig, Character, AnchorPoint } from "@/lib/character-editor/types";
import { deserializeCharacterSet } from "@/lib/character-editor/import/binary";
import { resizeCharacter } from "@/lib/character-editor/transforms";
import { formatSize } from "@/lib/character-editor/utils";
import { useLongPress } from "@/hooks/useLongPress";
import { useDragSelect } from "@/hooks/useDragSelect";
import { SelectionModeBar } from "@/components/ui/SelectionModeBar";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";

// 3x3 anchor grid
const ANCHOR_POSITIONS: AnchorPoint[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];

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
 * Character button with long-press support for selection mode
 */
function CharacterButton({
  character,
  index,
  isSelected,
  isSelectionMode,
  onClick,
  onLongPress,
}: {
  character: Character;
  index: number;
  isSelected: boolean;
  isSelectionMode: boolean;
  onClick: (index: number, shiftKey: boolean, ctrlKey: boolean) => void;
  onLongPress: (index: number) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onClick(index, e.shiftKey, e.ctrlKey || e.metaKey);
    },
    [index, onClick],
  );

  const handleLongPressCallback = useCallback(() => {
    onLongPress(index);
  }, [index, onLongPress]);

  const longPressHandlers = useLongPress({
    onLongPress: handleLongPressCallback,
  });

  return (
    <button
      onClick={handleClick}
      onMouseDown={longPressHandlers.onMouseDown}
      onMouseUp={longPressHandlers.onMouseUp}
      onMouseLeave={longPressHandlers.onMouseLeave}
      onTouchStart={longPressHandlers.onTouchStart}
      onTouchEnd={longPressHandlers.onTouchEnd}
      onTouchMove={longPressHandlers.onTouchMove}
      onContextMenu={longPressHandlers.onContextMenu}
      data-grid-index={index}
      className={`
        p-1 rounded border-2 transition-all relative touch-manipulation
        ${isSelected ? "border-retro-cyan bg-retro-cyan/20" : "border-transparent hover:border-retro-grid/50"}
      `}
      style={{ touchAction: "manipulation" }}
      title={`Character ${index}`}
    >
      <CharacterDisplay character={character} mode="small" smallScale={3} />
      {/* Checkmark overlay for selection mode */}
      {isSelectionMode && isSelected && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-retro-cyan rounded-bl flex items-center justify-center">
          <svg className="w-2 h-2 text-retro-dark" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
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
export function ImportCharactersModal({ isOpen, onClose, currentConfig, onImport }: ImportCharactersModalProps) {
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

  // Selection mode for touch-friendly multi-select
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Grid ref for drag-select
  const gridRef = useRef<HTMLDivElement>(null);

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
      setIsSelectionMode(false);
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
    return currentConfig.width !== selectedSet.config.width || currentConfig.height !== selectedSet.config.height;
  }, [selectedSet, currentConfig]);

  // Filter character sets
  const filteredSets = useMemo(() => {
    if (!searchQuery.trim()) return characterSets;
    const query = searchQuery.toLowerCase();
    return characterSets.filter(
      (set) =>
        set.metadata.name.toLowerCase().includes(query) || set.metadata.description.toLowerCase().includes(query),
    );
  }, [characterSets, searchQuery]);

  // Get item index from screen coordinates (for drag-select)
  // Uses DOM-based lookup for accuracy with auto-sized grid cells
  const getIndexFromPoint = useCallback(
    (clientX: number, clientY: number): number | null => {
      const element = document.elementFromPoint(clientX, clientY);
      if (!element) return null;

      // Traverse up to find element with data-grid-index
      let current: Element | null = element;
      while (current && current !== document.body) {
        const indexAttr = current.getAttribute("data-grid-index");
        if (indexAttr !== null) {
          const index = parseInt(indexAttr, 10);
          return index >= 0 && index < sourceCharacters.length ? index : null;
        }
        current = current.parentElement;
      }

      return null;
    },
    [sourceCharacters.length],
  );

  // Toggle selection for drag-select
  const toggleSelectionIndex = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Drag-select hook for iOS Photos-style multi-select
  const dragSelect = useDragSelect({
    enabled: isSelectionMode,
    onItemTouched: toggleSelectionIndex,
    getIndexFromPoint,
  });

  // Handlers
  const handleSelectSet = useCallback((set: SerializedCharacterSet) => {
    setSelectedSetId(set.metadata.id);
  }, []);

  const handleCharacterClick = useCallback(
    (index: number, shiftKey: boolean, ctrlKey: boolean) => {
      if (isSelectionMode) {
        // In selection mode, always toggle
        setSelectedIndices((prev) => {
          const next = new Set(prev);
          if (next.has(index)) {
            next.delete(index);
          } else {
            next.add(index);
          }
          return next;
        });
      } else {
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
      }
    },
    [lastClickedIndex, isSelectionMode],
  );

  const handleLongPress = useCallback((index: number) => {
    setIsSelectionMode(true);
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIndices(new Set(sourceCharacters.map((_, i) => i)));
  }, [sourceCharacters]);

  const handleSelectNone = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
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
        resizeCharacter(char, currentConfig.width, currentConfig.height, anchor),
      );
    }

    onImport(charsToImport);
    onClose();
  }, [selectedIndices, sourceCharacters, dimensionsDiffer, currentConfig, anchor, onImport, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" maxHeight="80vh">
      <ModalHeader>
        <h2 className="text-lg font-medium text-white">Import Characters</h2>
        <p className="text-xs text-gray-500 mt-1">
          {step === "select-set" && "Select a character set to import from"}
          {step === "select-chars" && `Select characters to import (${selectedIndices.size} selected)`}
          {step === "resize" && "Configure resize settings"}
        </p>
      </ModalHeader>

      <ModalContent className="p-4 flex flex-col min-h-0 overflow-hidden">
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
                  <span className="text-yellow-500 ml-2">(will be resized to {formatSize(currentConfig)})</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Characters */}
        {step === "select-chars" && selectedSet && (
          <div className="flex flex-col flex-1 min-h-0 gap-4 relative">
            {/* Selection controls */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-gray-500">
                {isSelectionMode
                  ? "Tap to toggle selection"
                  : "Click to select, Shift+click for range, Ctrl+click to toggle"}
              </div>
              <div className="flex items-center gap-2">
                {/* Selection mode toggle button */}
                <button
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    isSelectionMode
                      ? "bg-retro-cyan/20 text-retro-cyan"
                      : "text-gray-400 hover:text-retro-cyan hover:bg-retro-cyan/10"
                  }`}
                  title={isSelectionMode ? "Exit selection mode" : "Enter selection mode"}
                >
                  {isSelectionMode ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  )}
                  <span>Select</span>
                </button>
              </div>
            </div>

            {/* Character grid */}
            <div
              className={`bg-black/30 rounded-lg p-3 flex-1 overflow-y-auto min-h-0 ${
                isSelectionMode ? "pb-16 ring-1 ring-retro-cyan/30" : ""
              }`}
            >
              <div
                ref={gridRef}
                className="grid gap-1 select-none"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(${
                    Math.max(selectedSet.config.width * 3, 24) + 8
                  }px, 1fr))`,
                }}
                onTouchStartCapture={dragSelect.onTouchStart}
                onTouchMoveCapture={dragSelect.onTouchMove}
                onTouchEndCapture={dragSelect.onTouchEnd}
                onMouseDownCapture={dragSelect.onMouseDown}
                onMouseMoveCapture={dragSelect.onMouseMove}
                onMouseUpCapture={dragSelect.onMouseUp}
                onClickCapture={dragSelect.onClickCapture}
              >
                {sourceCharacters.map((char, index) => (
                  <CharacterButton
                    key={index}
                    character={char}
                    index={index}
                    isSelected={selectedIndices.has(index)}
                    isSelectionMode={isSelectionMode}
                    onClick={handleCharacterClick}
                    onLongPress={handleLongPress}
                  />
                ))}
              </div>
            </div>

            {/* Selection mode bar */}
            <SelectionModeBar
              isVisible={isSelectionMode}
              selectionCount={selectedIndices.size}
              totalItems={sourceCharacters.length}
              onSelectAll={handleSelectAll}
              onClearSelection={handleSelectNone}
              onExitMode={handleExitSelectionMode}
            />
          </div>
        )}

        {/* Step 3: Resize */}
        {step === "resize" && selectedSet && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-2">Source dimensions differ from target</p>
              <p className="text-xs text-gray-500">
                {formatSize(selectedSet.config)} → {formatSize(currentConfig)}
              </p>
            </div>

            {/* Anchor selection */}
            <div>
              <label className="block text-sm text-gray-300 mb-2 text-center">Anchor Position</label>
              <p className="text-xs text-gray-500 mb-3 text-center">Select where to anchor content when resizing</p>
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
                          ${
                            isSelected
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
      </ModalContent>

      <ModalFooter className="flex justify-between">
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
              (step === "select-set" && !selectedSetId) || (step === "select-chars" && selectedIndices.size === 0)
            }
            className="px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === "select-chars" && !dimensionsDiffer ? `Import (${selectedIndices.size})` : "Next"}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
