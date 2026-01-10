/**
 * Character CRUD Operations Hook
 *
 * Provides create, read, update, and delete operations for characters:
 * - addCharacter: Add empty character at the end
 * - insertCharacterAfter: Insert empty character after current selection
 * - addCharacters: Add multiple characters (from import)
 * - deleteSelected: Delete selected character(s)
 * - copyCharacter: Copy character from one position to another
 * - resizeCharacters: Resize all characters with anchor positioning
 * - updateCharacter: Update a single character
 * - setCharacters: Replace all characters
 *
 * Works with the undo/redo system via the updateState callback.
 *
 * @module hooks/character-editor/useCharacterCRUD
 */
"use client";

import { useCallback } from "react";
import {
  Character,
  CharacterSetConfig,
  AnchorPoint,
  cloneCharacter,
  createEmptyCharacter,
} from "@/lib/character-editor/types";
import { resizeCharacter } from "@/lib/character-editor/transforms";

export interface EditorState {
  characters: Character[];
  config: CharacterSetConfig;
}

export interface UseCharacterCRUDOptions {
  /** Update state function from undo/redo hook */
  updateState: (updater: (state: EditorState) => EditorState, label?: string) => void;
  /** Combined set of selected indices */
  selectedIndices: Set<number>;
  /** Primary selected index */
  selectedIndex: number;
  /** Current character count (for selection updates) */
  characterCount: number;
  /** Callback to update selection after add/delete */
  onSelectionChange: (newIndex: number) => void;
  /** Callback to clear batch selection after operations */
  onClearBatchSelection: () => void;
}

export interface UseCharacterCRUDResult {
  /** Add a new character at the end */
  addCharacter: () => void;
  /** Insert a new character after the currently selected index */
  insertCharacterAfter: () => void;
  /** Add multiple characters at the end */
  addCharacters: (characters: Character[]) => void;
  /** Duplicate all selected characters after the primary selection */
  duplicateSelected: () => void;
  /** Delete selected character(s) */
  deleteSelected: () => void;
  /** Copy a character to another position */
  copyCharacter: (fromIndex: number, toIndex: number) => void;
  /** Resize all characters */
  resizeCharacters: (newWidth: number, newHeight: number, anchor: AnchorPoint) => void;
  /** Update a specific character */
  updateCharacter: (index: number, character: Character) => void;
  /** Replace all characters */
  setCharacters: (characters: Character[]) => void;
}

/**
 * Hook for character CRUD operations
 *
 * Provides add, delete, copy, resize, and update operations for characters.
 */
export function useCharacterCRUD({
  updateState,
  selectedIndices,
  selectedIndex,
  characterCount,
  onSelectionChange,
  onClearBatchSelection,
}: UseCharacterCRUDOptions): UseCharacterCRUDResult {
  const addCharacter = useCallback(() => {
    updateState((state) => {
      const { width, height } = state.config;
      state.characters = [...state.characters, createEmptyCharacter(width, height)];
      return state;
    });
    // Select the new character
    onSelectionChange(characterCount);
    onClearBatchSelection();
  }, [updateState, characterCount, onSelectionChange, onClearBatchSelection]);

  const insertCharacterAfter = useCallback(() => {
    updateState((state) => {
      const { width, height } = state.config;
      const newCharacter = createEmptyCharacter(width, height);
      // Insert after the currently selected index
      const insertIndex = selectedIndex + 1;
      state.characters = [
        ...state.characters.slice(0, insertIndex),
        newCharacter,
        ...state.characters.slice(insertIndex),
      ];
      return state;
    });
    // Select the new character (which is now at selectedIndex + 1)
    onSelectionChange(selectedIndex + 1);
    onClearBatchSelection();
  }, [updateState, selectedIndex, onSelectionChange, onClearBatchSelection]);

  const addCharacters = useCallback(
    (newCharacters: Character[]) => {
      if (newCharacters.length === 0) return;

      updateState((state) => {
        state.characters = [...state.characters, ...newCharacters.map((c) => cloneCharacter(c))];
        return state;
      });
      // Select the first new character
      onSelectionChange(characterCount);
      onClearBatchSelection();
    },
    [updateState, characterCount, onSelectionChange, onClearBatchSelection],
  );

  const duplicateSelected = useCallback(() => {
    // Get all selected indices (primary + batch), sorted
    const allSelected = Array.from(selectedIndices).sort((a, b) => a - b);
    if (allSelected.length === 0) return;

    updateState((state) => {
      // Clone all selected characters
      const duplicates = allSelected.map((idx) => cloneCharacter(state.characters[idx]));
      // Insert after the primary selection index
      const insertIndex = selectedIndex + 1;
      state.characters = [
        ...state.characters.slice(0, insertIndex),
        ...duplicates,
        ...state.characters.slice(insertIndex),
      ];
      return state;
    }, "Duplicate characters");

    // Select the first duplicated character
    onSelectionChange(selectedIndex + 1);
    onClearBatchSelection();
  }, [updateState, selectedIndices, selectedIndex, onSelectionChange, onClearBatchSelection]);

  const deleteSelected = useCallback(() => {
    if (characterCount <= 1) return; // Keep at least one character

    updateState((state) => {
      state.characters = state.characters.filter((_, i) => !selectedIndices.has(i));
      return state;
    });

    // Adjust selection
    const newLength = characterCount - selectedIndices.size;
    onSelectionChange(Math.min(selectedIndex, newLength - 1));
    onClearBatchSelection();
  }, [updateState, selectedIndices, characterCount, selectedIndex, onSelectionChange, onClearBatchSelection]);

  const copyCharacter = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateState((state) => {
        const source = state.characters[fromIndex];
        if (source && toIndex >= 0 && toIndex < state.characters.length) {
          state.characters[toIndex] = cloneCharacter(source);
        }
        return state;
      });
    },
    [updateState],
  );

  const resizeCharacters = useCallback(
    (newWidth: number, newHeight: number, anchor: AnchorPoint) => {
      updateState((state) => {
        state.characters = state.characters.map((char) => resizeCharacter(char, newWidth, newHeight, anchor));
        state.config = { ...state.config, width: newWidth, height: newHeight };
        return state;
      });
    },
    [updateState],
  );

  const updateCharacter = useCallback(
    (index: number, character: Character) => {
      updateState((state) => {
        if (index >= 0 && index < state.characters.length) {
          state.characters[index] = cloneCharacter(character);
        }
        return state;
      });
    },
    [updateState],
  );

  const setCharacters = useCallback(
    (characters: Character[]) => {
      updateState((state) => {
        state.characters = characters.map(cloneCharacter);
        return state;
      });
    },
    [updateState],
  );

  return {
    addCharacter,
    insertCharacterAfter,
    addCharacters,
    duplicateSelected,
    deleteSelected,
    copyCharacter,
    resizeCharacters,
    updateCharacter,
    setCharacters,
  };
}
