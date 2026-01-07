"use client";

import { useState, useCallback, useEffect } from "react";
import { isPrintableAscii, getCharacterDisplayName } from "@/lib/character-editor/ascii";

export interface GoToCharacterModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Total number of characters */
  totalCharacters: number;
  /** Current character index */
  currentIndex: number;
  /** Callback when character is selected */
  onGoTo: (index: number) => void;
}

/**
 * Parse input as decimal or hex number
 */
function parseCharacterIndex(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) return null;

  // Hex format: 0x41, $41, or 41h
  if (trimmed.startsWith("0x")) {
    const num = parseInt(trimmed.slice(2), 16);
    return isNaN(num) ? null : num;
  }
  if (trimmed.startsWith("$")) {
    const num = parseInt(trimmed.slice(1), 16);
    return isNaN(num) ? null : num;
  }
  if (trimmed.endsWith("h")) {
    const num = parseInt(trimmed.slice(0, -1), 16);
    return isNaN(num) ? null : num;
  }

  // Decimal format
  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
}

/**
 * Modal for quickly jumping to a specific character by index
 */
export function GoToCharacterModal({
  isOpen,
  onClose,
  totalCharacters,
  currentIndex,
  onGoTo,
}: GoToCharacterModalProps) {
  const [input, setInput] = useState("");
  const [parsedIndex, setParsedIndex] = useState<number | null>(null);

  // Reset input when modal opens
  useEffect(() => {
    if (isOpen) {
      setInput("");
      setParsedIndex(null);
    }
  }, [isOpen]);

  // Parse input on change
  useEffect(() => {
    const index = parseCharacterIndex(input);
    setParsedIndex(index);
  }, [input]);

  // Check if parsed index is valid
  const isValid = parsedIndex !== null && parsedIndex >= 0 && parsedIndex < totalCharacters;

  // Go to character
  const handleGoTo = useCallback(() => {
    if (isValid && parsedIndex !== null) {
      onGoTo(parsedIndex);
      onClose();
    }
  }, [isValid, parsedIndex, onGoTo, onClose]);

  // Handle keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        handleGoTo();
      }
    },
    [onClose, handleGoTo]
  );

  if (!isOpen) return null;

  // Get character info for preview
  const isPrintable = parsedIndex !== null && isPrintableAscii(parsedIndex);
  const controlName = parsedIndex !== null ? getCharacterDisplayName(parsedIndex) : null;

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
      <div className="relative w-full max-w-xs bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Go to Character</h2>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">
            Character Index
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 65, 0x41, $41"
            className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan font-mono"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter decimal (65) or hex (0x41, $41)
          </p>
        </div>

        {/* Preview */}
        <div className="mb-4 p-3 bg-retro-dark/50 rounded border border-retro-grid/30 min-h-[60px]">
          {parsedIndex === null && input && (
            <p className="text-xs text-red-400">Invalid number format</p>
          )}
          {parsedIndex !== null && !isValid && (
            <p className="text-xs text-red-400">
              Index out of range (0-{totalCharacters - 1})
            </p>
          )}
          {isValid && parsedIndex !== null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Decimal:</span>
                <span className="text-sm text-retro-cyan font-mono">{parsedIndex}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Hex:</span>
                <span className="text-sm text-retro-cyan font-mono">0x{parsedIndex.toString(16).toUpperCase().padStart(2, "0")}</span>
              </div>
              {isPrintable && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">ASCII:</span>
                  <span className="text-sm text-retro-pink font-mono">&apos;{String.fromCharCode(parsedIndex)}&apos;</span>
                </div>
              )}
              {controlName && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Control:</span>
                  <span className="text-sm text-retro-pink">{controlName}</span>
                </div>
              )}
            </div>
          )}
          {!input && (
            <p className="text-xs text-gray-500">
              Current: {currentIndex} (0x{currentIndex.toString(16).toUpperCase().padStart(2, "0")})
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGoTo}
            disabled={!isValid}
            className="flex-1 px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
