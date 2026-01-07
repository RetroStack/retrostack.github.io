"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { CharacterSet, SerializedCharacterSet } from "@/lib/character-editor/types";
import { deserializeCharacterSet } from "@/lib/character-editor/binary";
import { useCharacterLibrary } from "@/hooks/character-editor";

export interface OverlaySearchModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when a character set is selected */
  onSelectSet: (characterSet: CharacterSet) => void;
  /** Current character set ID to exclude from list */
  excludeId?: string;
}

/**
 * Modal for selecting a character set to use as overlay for tracing
 */
export function OverlaySearchModal({
  isOpen,
  onClose,
  onSelectSet,
  excludeId,
}: OverlaySearchModalProps) {
  const { characterSets, loading } = useCharacterLibrary();
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional reset when modal closes
      setSearchQuery("");
    }
  }, [isOpen]);

  // Filter character sets
  const filteredSets = useMemo(() => {
    return characterSets.filter((set) => {
      // Exclude current set
      if (excludeId && set.metadata.id === excludeId) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          set.metadata.name.toLowerCase().includes(query) ||
          set.metadata.description?.toLowerCase().includes(query) ||
          set.metadata.manufacturer?.toLowerCase().includes(query) ||
          set.metadata.system?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [characterSets, excludeId, searchQuery]);

  const handleSelectSet = useCallback(
    (set: SerializedCharacterSet) => {
      try {
        const deserialized = deserializeCharacterSet(set);
        onSelectSet(deserialized);
        onClose();
      } catch (e) {
        console.error("Failed to deserialize character set:", e);
      }
    },
    [onSelectSet, onClose]
  );

  const handleClose = useCallback(() => {
    setSearchQuery("");
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-retro-dark border border-retro-grid/50 rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-retro-grid/30">
          <div>
            <h2 className="text-lg font-medium text-white">
              Select Overlay Character Set
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Choose a character set to overlay for tracing
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

        {/* Search */}
        <div className="p-4 border-b border-retro-grid/30">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search character sets..."
              className="w-full px-4 py-2 pl-10 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50"
              autoFocus
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Character set list */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? "No character sets match your search"
                : "No character sets available"}
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredSets.map((set) => (
                <CharacterSetListItem
                  key={set.metadata.id}
                  characterSet={set}
                  onSelect={() => handleSelectSet(set)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * List item for a character set
 */
function CharacterSetListItem({
  characterSet,
  onSelect,
}: {
  characterSet: SerializedCharacterSet;
  onSelect: () => void;
}) {
  const meta = characterSet.metadata;
  const config = characterSet.config;

  // Calculate character count from binary data
  const bytesPerChar = Math.ceil(config.width / 8) * config.height;
  const binaryLength = characterSet.binaryData ?
    Math.ceil(characterSet.binaryData.length * 3 / 4) : 0;
  const charCount = bytesPerChar > 0 ? Math.floor(binaryLength / bytesPerChar) : 0;

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-retro-grid/30 hover:border-retro-amber/50 hover:bg-retro-amber/5 text-left transition-colors"
    >
      {/* Size badge */}
      <div className="w-12 h-12 bg-black/50 rounded flex-shrink-0 flex items-center justify-center">
        <span className="text-xs text-gray-400 font-mono">
          {config.width}x{config.height}
        </span>
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
          <span>{charCount} chars</span>
          {meta.manufacturer && (
            <>
              <span>·</span>
              <span className="truncate">{meta.manufacturer}</span>
            </>
          )}
          {meta.system && (
            <>
              <span>·</span>
              <span className="truncate">{meta.system}</span>
            </>
          )}
          {meta.chip && (
            <>
              <span>·</span>
              <span className="truncate">{meta.chip}</span>
            </>
          )}
        </div>
      </div>

      {/* Select indicator */}
      <svg className="w-5 h-5 text-retro-amber/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
