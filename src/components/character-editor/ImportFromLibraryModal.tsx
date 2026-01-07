"use client";

import { useState, useCallback, useMemo } from "react";
import { CharacterSet } from "@/lib/character-editor/types";
import { CharacterPreview } from "./CharacterPreview";

export interface ImportFromLibraryModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Available character sets to choose from */
  characterSets: CharacterSet[];
  /** Callback when a character set is selected for full import */
  onSelectSet: (characterSet: CharacterSet) => void;
  /** Callback when user wants to pick individual characters */
  onPickCharacters: (characterSet: CharacterSet) => void;
  /** Current character set ID to exclude from list */
  excludeId?: string;
}

/**
 * Modal for selecting a character set to import from
 */
export function ImportFromLibraryModal({
  isOpen,
  onClose,
  characterSets,
  onSelectSet,
  onPickCharacters,
  excludeId,
}: ImportFromLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSet, setSelectedSet] = useState<CharacterSet | null>(null);

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

  const handleSelectSet = useCallback((set: CharacterSet) => {
    setSelectedSet(set);
  }, []);

  const handleImportAll = useCallback(() => {
    if (selectedSet) {
      onSelectSet(selectedSet);
      onClose();
    }
  }, [selectedSet, onSelectSet, onClose]);

  const handlePickCharacters = useCallback(() => {
    if (selectedSet) {
      onPickCharacters(selectedSet);
    }
  }, [selectedSet, onPickCharacters]);

  const handleClose = useCallback(() => {
    setSelectedSet(null);
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
          <h2 className="text-lg font-medium text-white">
            Import from Library
          </h2>
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
          {filteredSets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? "No character sets match your search"
                : "No character sets available"}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredSets.map((set) => (
                <CharacterSetListItem
                  key={set.metadata.id}
                  characterSet={set}
                  isSelected={selectedSet?.metadata.id === set.metadata.id}
                  onSelect={() => handleSelectSet(set)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Selected set preview and actions */}
        {selectedSet && (
          <div className="p-4 border-t border-retro-grid/30 space-y-4">
            <div className="flex gap-4">
              {/* Preview */}
              <div className="w-24 h-24 bg-black/50 rounded-lg p-2 flex-shrink-0">
                <CharacterPreview
                  characters={selectedSet.characters.slice(0, 64)}
                  config={selectedSet.config}
                  maxWidth={80}
                  maxHeight={80}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">
                  {selectedSet.metadata.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedSet.characters.length} characters ({selectedSet.config.width}x{selectedSet.config.height})
                </p>
                {selectedSet.metadata.manufacturer && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedSet.metadata.manufacturer}
                    {selectedSet.metadata.system && ` / ${selectedSet.metadata.system}`}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleImportAll}
                className="flex-1 px-4 py-2 text-sm bg-retro-cyan/20 text-retro-cyan border border-retro-cyan rounded-lg hover:bg-retro-cyan/30 transition-colors"
              >
                Duplicate Entire Set
              </button>
              <button
                onClick={handlePickCharacters}
                className="flex-1 px-4 py-2 text-sm bg-retro-pink/20 text-retro-pink border border-retro-pink rounded-lg hover:bg-retro-pink/30 transition-colors"
              >
                Pick Characters...
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * List item for a character set
 */
function CharacterSetListItem({
  characterSet,
  isSelected,
  onSelect,
}: {
  characterSet: CharacterSet;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const meta = characterSet.metadata;

  return (
    <button
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors
        ${
          isSelected
            ? "border-retro-cyan bg-retro-cyan/10"
            : "border-retro-grid/30 hover:border-retro-grid/50 hover:bg-retro-navy/30"
        }
      `}
    >
      {/* Mini preview */}
      <div className="w-12 h-12 bg-black/50 rounded flex-shrink-0 p-1 flex items-center justify-center">
        <CharacterPreview
          characters={characterSet.characters.slice(0, 16)}
          config={characterSet.config}
          maxWidth={40}
          maxHeight={40}
        />
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
          <span>{characterSet.characters.length} chars</span>
          <span>·</span>
          <span>{characterSet.config.width}x{characterSet.config.height}</span>
          {meta.manufacturer && (
            <>
              <span>·</span>
              <span className="truncate">{meta.manufacturer}</span>
            </>
          )}
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <svg className="w-5 h-5 text-retro-cyan flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      )}
    </button>
  );
}
