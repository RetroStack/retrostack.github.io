/**
 * Main Character Editor State Management Hook
 *
 * The central orchestration hook for the character editor. Coordinates:
 * - Character selection (single + batch) via useCharacterSelection
 * - Pixel/transform operations via useCharacterTransforms
 * - CRUD operations (add/delete/copy) via useCharacterCRUD
 * - Undo/redo history with timeline slider via useUndoRedo
 * - Dirty state tracking for unsaved changes detection
 *
 * This is the primary hook used by EditView to manage the entire
 * editor state. All other character-editor hooks are composed here.
 *
 * @module hooks/character-editor/useCharacterEditor
 */
"use client";

import { useState, useCallback } from "react";
import { Character, CharacterSet, CharacterSetConfig, cloneCharacter } from "@/lib/character-editor/types";
import { useUndoRedo, deepClone, HistoryEntry } from "./useUndoRedo";
import { useCharacterSelection, UseCharacterSelectionResult } from "./useCharacterSelection";
import { useCharacterTransforms, UseCharacterTransformsResult, EditorState } from "./useCharacterTransforms";
import { useCharacterCRUD, UseCharacterCRUDResult } from "./useCharacterCRUD";

// Re-export EditorState for consumers
export type { EditorState } from "./useCharacterTransforms";

export interface UseCharacterEditorResult
  extends Omit<UseCharacterSelectionResult, "adjustSelectionAfterDelete" | "resetSelection">,
    UseCharacterTransformsResult,
    UseCharacterCRUDResult {
  /** Current characters */
  characters: Character[];
  /** Character set configuration */
  config: CharacterSetConfig;
  /** Undo */
  undo: () => void;
  /** Redo */
  redo: () => void;
  /** Can undo */
  canUndo: boolean;
  /** Can redo */
  canRedo: boolean;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Mark as saved (clears dirty flag) */
  markSaved: () => void;
  /** Reset editor with new character set */
  reset: (characterSet: CharacterSet) => void;
  /** Full history timeline for slider display */
  history: HistoryEntry<EditorState>[];
  /** Current position in history */
  historyIndex: number;
  /** Jump to a specific point in history */
  jumpToHistory: (index: number) => void;
  /** Total number of history entries */
  totalHistoryEntries: number;
  /** Start batching changes (for drag operations) */
  startBatch: () => void;
  /** End batching and commit as single history entry */
  endBatch: (label?: string) => void;
  /** Clear all history entries */
  clearHistory: () => void;
}

/**
 * Main editor state management hook
 *
 * Coordinates:
 * - Character selection (useCharacterSelection)
 * - Transform operations (useCharacterTransforms)
 * - CRUD operations (useCharacterCRUD)
 * - Undo/redo history (useUndoRedo)
 * - Dirty state tracking
 */
export function useCharacterEditor(initialCharacterSet: CharacterSet | null): UseCharacterEditorResult {
  // Initialize state
  const initialState: EditorState = initialCharacterSet
    ? {
        characters: initialCharacterSet.characters.map(cloneCharacter),
        config: { ...initialCharacterSet.config },
      }
    : {
        characters: [],
        config: { width: 8, height: 8, padding: "right", bitDirection: "ltr" },
      };

  // Use undo/redo hook for editor state
  const {
    state: editorState,
    setState: setEditorState,
    resetState: resetEditorState,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
    historyIndex,
    jumpToHistory,
    totalHistoryEntries,
    startBatch,
    endBatch,
    clearHistory,
  } = useUndoRedo<EditorState>(initialState);

  // Dirty state tracking
  const [isDirty, setIsDirty] = useState(false);
  const [, setLastSavedState] = useState<EditorState | null>(null);

  // Helper to update state and mark dirty
  const updateState = useCallback(
    (updater: (state: EditorState) => EditorState, label?: string) => {
      const newState = updater(deepClone(editorState));
      setEditorState(newState, label);
      setIsDirty(true);
    },
    [editorState, setEditorState],
  );

  // Selection management
  const selection = useCharacterSelection({
    characterCount: editorState.characters.length,
    initialIndex: 0,
  });

  // Transform operations
  const transforms = useCharacterTransforms({
    updateState,
    selectedIndices: selection.selectedIndices,
    selectedIndex: selection.selectedIndex,
    characters: editorState.characters,
  });

  // CRUD operations
  const crud = useCharacterCRUD({
    updateState,
    selectedIndices: selection.selectedIndices,
    selectedIndex: selection.selectedIndex,
    characterCount: editorState.characters.length,
    onSelectionChange: selection.setSelectedIndex,
    onClearBatchSelection: selection.clearBatchSelection,
  });

  const markSaved = useCallback(() => {
    setIsDirty(false);
    setLastSavedState(deepClone(editorState));
  }, [editorState]);

  const reset = useCallback(
    (characterSet: CharacterSet) => {
      resetEditorState({
        characters: characterSet.characters.map(cloneCharacter),
        config: { ...characterSet.config },
      });
      selection.resetSelection(0);
      setIsDirty(false);
      setLastSavedState(null);
    },
    [resetEditorState, selection],
  );

  return {
    // State
    characters: editorState.characters,
    config: editorState.config,

    // Selection (from useCharacterSelection)
    selectedIndex: selection.selectedIndex,
    setSelectedIndex: selection.setSelectedIndex,
    batchSelection: selection.batchSelection,
    toggleBatchSelection: selection.toggleBatchSelection,
    clearBatchSelection: selection.clearBatchSelection,
    selectAll: selection.selectAll,
    selectedIndices: selection.selectedIndices,

    // Transforms (from useCharacterTransforms)
    toggleSelectedPixel: transforms.toggleSelectedPixel,
    setSelectedPixel: transforms.setSelectedPixel,
    getSelectedPixelState: transforms.getSelectedPixelState,
    rotateSelected: transforms.rotateSelected,
    shiftSelected: transforms.shiftSelected,
    invertSelected: transforms.invertSelected,
    flipSelectedHorizontal: transforms.flipSelectedHorizontal,
    flipSelectedVertical: transforms.flipSelectedVertical,
    clearSelected: transforms.clearSelected,
    fillSelected: transforms.fillSelected,
    centerSelected: transforms.centerSelected,
    scaleSelected: transforms.scaleSelected,

    // CRUD (from useCharacterCRUD)
    addCharacter: crud.addCharacter,
    insertCharacterAfter: crud.insertCharacterAfter,
    addCharacters: crud.addCharacters,
    duplicateSelected: crud.duplicateSelected,
    deleteSelected: crud.deleteSelected,
    copyCharacter: crud.copyCharacter,
    resizeCharacters: crud.resizeCharacters,
    updateCharacter: crud.updateCharacter,
    setCharacters: crud.setCharacters,
    replaceCharactersAtIndices: crud.replaceCharactersAtIndices,

    // Undo/redo
    undo,
    redo,
    canUndo,
    canRedo,
    history,
    historyIndex,
    jumpToHistory,
    totalHistoryEntries,
    startBatch,
    endBatch,
    clearHistory,

    // Dirty state
    isDirty,
    markSaved,
    reset,
  };
}
