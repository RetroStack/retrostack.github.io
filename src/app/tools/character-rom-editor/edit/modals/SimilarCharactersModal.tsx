"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Modal, ModalHeader, ModalContent } from "@/components/ui/Modal";
import { Character, CharacterSet, CharacterSetConfig } from "@/lib/character-editor/types";
import { useCharacterLibrary } from "@/hooks/character-editor/useCharacterLibrary";
import {
  calculateSimilarities,
  CharacterSetSimilarity,
} from "@/lib/character-editor/similarity";
import { CharacterDiffDisplay } from "@/components/character-editor/character/CharacterDiffDisplay";
import { findDifferingPixels } from "@/lib/character-editor/utils";

/** Semi-transparent red for diff highlighting */
const DIFF_COLOR = "rgba(255, 51, 51, 0.6)";

export interface SimilarCharactersModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Current character set's characters */
  currentCharacters: Character[];
  /** Current character set's configuration */
  currentConfig: CharacterSetConfig;
  /** Current character set's ID (to exclude from results) */
  excludeId?: string;
  /** Foreground color for character display */
  foregroundColor: string;
  /** Background color for character display */
  backgroundColor: string;
  /** Callback when a character set is selected for overlay */
  onSelectForOverlay: (characterSet: CharacterSet) => void;
}

/**
 * Modal for finding and selecting similar character sets
 *
 * Displays all character sets sorted by similarity to the current set,
 * with detailed preview and diff highlighting for the selected set.
 */
export function SimilarCharactersModal({
  isOpen,
  onClose,
  currentCharacters,
  currentConfig,
  excludeId,
  foregroundColor,
  backgroundColor,
  onSelectForOverlay,
}: SimilarCharactersModalProps) {
  const { characterSets, loading } = useCharacterLibrary();
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [similarities, setSimilarities] = useState<CharacterSetSimilarity[]>([]);

  // Reset state when modal closes - intentional state sync with prop
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: reset state when modal closes
      setSelectedSetId(null);
    }
  }, [isOpen]);

  // Calculate similarities when modal opens or data changes
  useEffect(() => {
    if (!isOpen || loading || characterSets.length === 0) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: show loading state before async calculation
    setCalculating(true);

    // Use requestAnimationFrame to avoid blocking the UI
    const frameId = requestAnimationFrame(() => {
      const results = calculateSimilarities(
        currentCharacters,
        currentConfig,
        characterSets,
        excludeId
      );
      setSimilarities(results);
      setCalculating(false);
    });

    return () => cancelAnimationFrame(frameId);
  }, [isOpen, loading, characterSets, currentCharacters, currentConfig, excludeId]);

  // Get the selected similarity result
  const selectedSimilarity = useMemo(() => {
    return similarities.find((s) => s.characterSetId === selectedSetId) || null;
  }, [similarities, selectedSetId]);

  // Handle selecting a character set from the list
  const handleSelectSet = useCallback((setId: string) => {
    setSelectedSetId((prev) => (prev === setId ? null : setId));
  }, []);

  // Handle using selected set as overlay
  const handleUseAsOverlay = useCallback(() => {
    if (selectedSimilarity) {
      const characterSet: CharacterSet = {
        metadata: selectedSimilarity.metadata,
        config: selectedSimilarity.config,
        characters: selectedSimilarity.characters,
      };
      onSelectForOverlay(characterSet);
      onClose();
    }
  }, [selectedSimilarity, onSelectForOverlay, onClose]);

  const isLoading = loading || calculating;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" maxHeight="90vh">
      <ModalHeader onClose={onClose} showCloseButton>
        <div>
          <h2 className="text-lg font-medium text-white">Similar Character Sets</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Find character sets similar to your current work
          </p>
        </div>
      </ModalHeader>

      <ModalContent className="p-0 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left panel - list of character sets */}
          <div className="w-full md:w-72 overflow-y-auto p-4 border-r border-retro-grid/30">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-6 h-6 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">
                  {loading ? "Loading character sets..." : "Calculating similarities..."}
                </p>
              </div>
            ) : similarities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm">No other character sets found</p>
                <p className="text-xs mt-1">
                  Create or import more character sets to compare
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {similarities.map((similarity) => (
                  <SimilarityListItem
                    key={similarity.characterSetId}
                    similarity={similarity}
                    isSelected={selectedSetId === similarity.characterSetId}
                    onClick={() => handleSelectSet(similarity.characterSetId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right panel - detail preview */}
          <div className="w-full md:flex-1 p-4 bg-retro-dark/30 flex flex-col">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Preview</h3>
            {selectedSimilarity ? (
              <SelectedSetPreview
                similarity={selectedSimilarity}
                currentCharacters={currentCharacters}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                onUseAsOverlay={handleUseAsOverlay}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <p className="text-sm">Select a character set to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

/**
 * List item for a similar character set
 */
function SimilarityListItem({
  similarity,
  isSelected,
  onClick,
}: {
  similarity: CharacterSetSimilarity;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meta = similarity.metadata;
  const config = similarity.config;

  // Determine match quality for color coding
  const matchQuality = useMemo(() => {
    if (similarity.matchPercentage >= 90) return "high";
    if (similarity.matchPercentage >= 70) return "medium";
    return "low";
  }, [similarity.matchPercentage]);

  const matchColors = {
    high: "text-green-400",
    medium: "text-amber-400",
    low: "text-red-400",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
        isSelected
          ? "bg-retro-cyan/10 border-retro-cyan"
          : "bg-retro-dark/30 border-retro-grid/30 hover:border-retro-grid/50"
      }`}
    >
      {/* Match percentage badge */}
      <div className="w-14 h-14 bg-black/50 rounded flex-shrink-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${matchColors[matchQuality]}`}>
          {similarity.matchPercentage}%
        </span>
        <span className="text-[10px] text-gray-500">match</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white truncate">{meta.name}</span>
          {meta.isBuiltIn && (
            <span className="px-1.5 py-0.5 text-[10px] bg-retro-purple/30 text-retro-pink rounded">
              Built-in
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          <span>{similarity.totalCharacters} chars</span>
          <span>·</span>
          <span>
            {config.width}x{config.height}
          </span>
          {meta.manufacturer && (
            <>
              <span>·</span>
              <span className="truncate">{meta.manufacturer}</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-0.5">
          {similarity.matchedCharacters} characters compared
        </p>
      </div>

      {/* Chevron */}
      <svg
        className={`w-5 h-5 flex-shrink-0 transition-colors ${
          isSelected ? "text-retro-cyan" : "text-gray-600"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}

/**
 * Preview panel for the selected character set
 */
function SelectedSetPreview({
  similarity,
  currentCharacters,
  foregroundColor,
  backgroundColor,
  onUseAsOverlay,
}: {
  similarity: CharacterSetSimilarity;
  currentCharacters: Character[];
  foregroundColor: string;
  backgroundColor: string;
  onUseAsOverlay: () => void;
}) {
  const meta = similarity.metadata;
  const config = similarity.config;

  // Calculate diff pixels for each character
  const diffPixelsByIndex = useMemo(() => {
    const result: Map<number, Set<string>> = new Map();
    for (let i = 0; i < similarity.characters.length; i++) {
      if (i < currentCharacters.length) {
        const diffPixels = findDifferingPixels(
          currentCharacters[i],
          similarity.characters[i]
        );
        if (diffPixels.size > 0) {
          result.set(i, diffPixels);
        }
      }
    }
    return result;
  }, [similarity.characters, currentCharacters]);

  return (
    <div className="flex flex-col h-full">
      {/* Header info */}
      <div className="mb-3">
        <h4 className="text-sm font-medium text-white truncate">{meta.name}</h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
          <span>{similarity.totalCharacters} chars</span>
          <span>·</span>
          <span>
            {config.width}x{config.height}
          </span>
          {meta.manufacturer && (
            <>
              <span>·</span>
              <span>{meta.manufacturer}</span>
            </>
          )}
          {meta.system && (
            <>
              <span>·</span>
              <span>{meta.system}</span>
            </>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`text-lg font-bold ${
              similarity.matchPercentage >= 90
                ? "text-green-400"
                : similarity.matchPercentage >= 70
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {similarity.matchPercentage}% match
          </span>
          <span className="text-xs text-gray-600">
            ({similarity.matchedCharacters} chars compared)
          </span>
        </div>
      </div>

      {/* Character grid with diff highlighting */}
      <div className="flex-1 overflow-auto bg-retro-dark rounded border border-retro-grid/30 p-2 mb-3">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(16, ${config.width * 2 + 4}px)`,
          }}
        >
          {similarity.characters.map((char, index) => {
            const diffPixels = diffPixelsByIndex.get(index);
            const hasDiff = diffPixels && diffPixels.size > 0;

            return (
              <div
                key={index}
                className={`relative ${hasDiff ? "ring-1 ring-amber-500/50 rounded-sm" : ""}`}
                title={`Character ${index}${hasDiff ? ` (${diffPixels?.size} pixels differ)` : ""}`}
              >
                <CharacterDiffDisplay
                  character={char}
                  comparisonCharacter={currentCharacters[index]}
                  scale={2}
                  foregroundColor={foregroundColor}
                  backgroundColor={backgroundColor}
                  diffColor={DIFF_COLOR}
                  showDiffBorder={false}
                  index={index}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: DIFF_COLOR }}
          />
          <span>Different pixels</span>
        </div>
      </div>

      {/* Action button */}
      <Button onClick={onUseAsOverlay} variant="cyan" size="sm" className="w-full">
        Use as Overlay
      </Button>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Use this set as a tracing overlay in the editor
      </p>
    </div>
  );
}
