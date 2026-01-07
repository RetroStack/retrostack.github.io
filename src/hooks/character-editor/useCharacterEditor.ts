"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Character,
  CharacterSet,
  CharacterSetConfig,
  AnchorPoint,
  cloneCharacter,
  createEmptyCharacter,
} from "@/lib/character-editor/types";
import {
  togglePixel,
  setPixel,
  rotateCharacter,
  shiftCharacter,
  resizeCharacter,
  invertCharacter,
  flipHorizontal,
  flipVertical,
  getPixelState,
  batchTogglePixel,
  batchTransform,
  centerCharacter,
  scaleCharacter,
  ScaleAlgorithm,
} from "@/lib/character-editor/transforms";
import { useUndoRedo, deepClone, HistoryEntry } from "./useUndoRedo";

export interface EditorState {
  characters: Character[];
  config: CharacterSetConfig;
}

export interface UseCharacterEditorResult {
  /** Current characters */
  characters: Character[];
  /** Character set configuration */
  config: CharacterSetConfig;
  /** Currently selected character index */
  selectedIndex: number;
  /** Set selected character index */
  setSelectedIndex: (index: number) => void;
  /** Batch selected character indices */
  batchSelection: Set<number>;
  /** Toggle batch selection for an index */
  toggleBatchSelection: (index: number, extend: boolean, toggle?: boolean) => void;
  /** Clear batch selection */
  clearBatchSelection: () => void;
  /** Select all characters */
  selectAll: () => void;
  /** Toggle a pixel in the selected character(s) */
  toggleSelectedPixel: (row: number, col: number) => void;
  /** Set a pixel value in the selected character(s) */
  setSelectedPixel: (row: number, col: number, value: boolean) => void;
  /** Get pixel state for batch editing */
  getSelectedPixelState: (row: number, col: number) => "same-on" | "same-off" | "mixed";
  /** Rotate selected character(s) */
  rotateSelected: (direction: "left" | "right") => void;
  /** Shift selected character(s) */
  shiftSelected: (direction: "up" | "down" | "left" | "right", wrap?: boolean) => void;
  /** Invert selected character(s) */
  invertSelected: () => void;
  /** Flip selected character(s) horizontally */
  flipSelectedHorizontal: () => void;
  /** Flip selected character(s) vertically */
  flipSelectedVertical: () => void;
  /** Clear selected character(s) */
  clearSelected: () => void;
  /** Fill selected character(s) */
  fillSelected: () => void;
  /** Center selected character(s) content */
  centerSelected: () => void;
  /** Scale selected character(s) */
  scaleSelected: (scale: number, anchor: AnchorPoint, algorithm: ScaleAlgorithm) => void;
  /** Combined set of all selected indices (selectedIndex + batchSelection) */
  selectedIndices: Set<number>;
  /** Add a new character at the end */
  addCharacter: () => void;
  /** Add multiple characters at the end */
  addCharacters: (characters: Character[]) => void;
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
}

/**
 * Main editor state management hook
 */
export function useCharacterEditor(
  initialCharacterSet: CharacterSet | null
): UseCharacterEditorResult {
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

  // Use undo/redo hook for characters
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
  } = useUndoRedo<EditorState>(initialState);

  // Selection state (not undoable)
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [batchSelection, setBatchSelection] = useState<Set<number>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [, setLastSavedState] = useState<EditorState | null>(null);

  // Get selected indices (including batch)
  const selectedIndices = useMemo(() => {
    const indices = new Set(batchSelection);
    indices.add(selectedIndex);
    return indices;
  }, [selectedIndex, batchSelection]);

  // Helper to update state and mark dirty
  const updateState = useCallback(
    (updater: (state: EditorState) => EditorState, label?: string) => {
      const newState = updater(deepClone(editorState));
      setEditorState(newState, label);
      setIsDirty(true);
    },
    [editorState, setEditorState]
  );

  // Track anchor point for range selection
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null);

  // Toggle batch selection
  const toggleBatchSelection = useCallback(
    (index: number, extend: boolean, toggle: boolean = false) => {
      if (toggle) {
        // CMD/CTRL+click: toggle individual item in/out of selection
        setBatchSelection((prev) => {
          const next = new Set(prev);
          if (index === selectedIndex) {
            // Clicking the primary selection with CMD/CTRL
            // If there are other items in batch, make one of them the new primary
            if (next.size > 0) {
              const [newPrimary] = next;
              next.delete(newPrimary);
              next.add(selectedIndex);
              setSelectedIndex(newPrimary);
            }
            // If nothing else selected, ignore (can't deselect everything)
          } else if (next.has(index)) {
            // Remove from batch selection
            next.delete(index);
          } else {
            // Add to batch selection
            next.add(index);
          }
          return next;
        });
      } else if (extend) {
        // Shift+click: select range from anchor (or current selection) to clicked index
        const anchor = selectionAnchor ?? selectedIndex;
        const start = Math.min(anchor, index);
        const end = Math.max(anchor, index);

        // Create new selection with range
        const rangeSelection = new Set<number>();
        for (let i = start; i <= end; i++) {
          rangeSelection.add(i);
        }

        // Set the clicked index as the new selected index
        // and add everything else (except clicked) to batch
        setSelectedIndex(index);
        rangeSelection.delete(index);
        setBatchSelection(rangeSelection);
      } else {
        // Normal click: select single and set as anchor for future range selections
        setSelectedIndex(index);
        setSelectionAnchor(index);
        setBatchSelection(new Set());
      }
    },
    [selectedIndex, selectionAnchor]
  );

  const clearBatchSelection = useCallback(() => {
    setBatchSelection(new Set());
  }, []);

  const selectAll = useCallback(() => {
    const all = new Set(
      Array.from({ length: editorState.characters.length }, (_, i) => i)
    );
    setBatchSelection(all);
  }, [editorState.characters.length]);

  // Pixel operations
  const toggleSelectedPixel = useCallback(
    (row: number, col: number) => {
      updateState((state) => {
        if (selectedIndices.size > 1) {
          // Batch toggle
          state.characters = batchTogglePixel(
            state.characters,
            selectedIndices,
            row,
            col
          );
        } else {
          // Single toggle
          const char = state.characters[selectedIndex];
          if (char) {
            state.characters[selectedIndex] = togglePixel(char, row, col);
          }
        }
        return state;
      });
    },
    [updateState, selectedIndex, selectedIndices]
  );

  const setSelectedPixel = useCallback(
    (row: number, col: number, value: boolean) => {
      updateState((state) => {
        for (const index of selectedIndices) {
          const char = state.characters[index];
          if (char) {
            state.characters[index] = setPixel(char, row, col, value);
          }
        }
        return state;
      });
    },
    [updateState, selectedIndices]
  );

  const getSelectedPixelState = useCallback(
    (row: number, col: number): "same-on" | "same-off" | "mixed" => {
      return getPixelState(editorState.characters, selectedIndices, row, col);
    },
    [editorState.characters, selectedIndices]
  );

  // Transform operations
  const rotateSelected = useCallback(
    (direction: "left" | "right") => {
      updateState((state) => {
        state.characters = batchTransform(
          state.characters,
          selectedIndices,
          (char) => rotateCharacter(char, direction)
        );
        return state;
      });
    },
    [updateState, selectedIndices]
  );

  const shiftSelected = useCallback(
    (direction: "up" | "down" | "left" | "right", wrap: boolean = true) => {
      updateState((state) => {
        state.characters = batchTransform(
          state.characters,
          selectedIndices,
          (char) => shiftCharacter(char, direction, wrap)
        );
        return state;
      });
    },
    [updateState, selectedIndices]
  );

  const invertSelected = useCallback(() => {
    updateState((state) => {
      state.characters = batchTransform(
        state.characters,
        selectedIndices,
        invertCharacter
      );
      return state;
    });
  }, [updateState, selectedIndices]);

  const flipSelectedHorizontal = useCallback(() => {
    updateState((state) => {
      state.characters = batchTransform(
        state.characters,
        selectedIndices,
        flipHorizontal
      );
      return state;
    });
  }, [updateState, selectedIndices]);

  const flipSelectedVertical = useCallback(() => {
    updateState((state) => {
      state.characters = batchTransform(
        state.characters,
        selectedIndices,
        flipVertical
      );
      return state;
    });
  }, [updateState, selectedIndices]);

  const clearSelected = useCallback(() => {
    updateState((state) => {
      const { width, height } = state.config;
      state.characters = batchTransform(
        state.characters,
        selectedIndices,
        () => createEmptyCharacter(width, height)
      );
      return state;
    });
  }, [updateState, selectedIndices]);

  const fillSelected = useCallback(() => {
    updateState((state) => {
      const { width, height } = state.config;
      state.characters = batchTransform(
        state.characters,
        selectedIndices,
        () => ({
          pixels: Array.from({ length: height }, () =>
            Array(width).fill(true)
          ),
        })
      );
      return state;
    });
  }, [updateState, selectedIndices]);

  const centerSelected = useCallback(() => {
    updateState((state) => {
      state.characters = batchTransform(
        state.characters,
        selectedIndices,
        centerCharacter
      );
      return state;
    });
  }, [updateState, selectedIndices]);

  const scaleSelected = useCallback(
    (scale: number, anchor: AnchorPoint, algorithm: ScaleAlgorithm) => {
      updateState((state) => {
        state.characters = batchTransform(
          state.characters,
          selectedIndices,
          (char) => scaleCharacter(char, scale, anchor, algorithm)
        );
        return state;
      });
    },
    [updateState, selectedIndices]
  );

  // Character management
  const addCharacter = useCallback(() => {
    updateState((state) => {
      const { width, height } = state.config;
      state.characters = [...state.characters, createEmptyCharacter(width, height)];
      return state;
    });
    // Select the new character
    setSelectedIndex(editorState.characters.length);
    setBatchSelection(new Set());
  }, [updateState, editorState.characters.length]);

  const addCharacters = useCallback(
    (newCharacters: Character[]) => {
      if (newCharacters.length === 0) return;

      updateState((state) => {
        state.characters = [...state.characters, ...newCharacters.map(c => cloneCharacter(c))];
        return state;
      });
      // Select the first new character
      setSelectedIndex(editorState.characters.length);
      setBatchSelection(new Set());
    },
    [updateState, editorState.characters.length]
  );

  const deleteSelected = useCallback(() => {
    if (editorState.characters.length <= 1) return; // Keep at least one character

    updateState((state) => {
      state.characters = state.characters.filter(
        (_, i) => !selectedIndices.has(i)
      );
      return state;
    });

    // Adjust selection
    const newLength = editorState.characters.length - selectedIndices.size;
    setSelectedIndex(Math.min(selectedIndex, newLength - 1));
    setBatchSelection(new Set());
  }, [updateState, selectedIndices, editorState.characters.length, selectedIndex]);

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
    [updateState]
  );

  const resizeCharacters = useCallback(
    (newWidth: number, newHeight: number, anchor: AnchorPoint) => {
      updateState((state) => {
        state.characters = state.characters.map((char) =>
          resizeCharacter(char, newWidth, newHeight, anchor)
        );
        state.config = { ...state.config, width: newWidth, height: newHeight };
        return state;
      });
    },
    [updateState]
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
    [updateState]
  );

  const setCharacters = useCallback(
    (characters: Character[]) => {
      updateState((state) => {
        state.characters = characters.map(cloneCharacter);
        return state;
      });
    },
    [updateState]
  );

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
      setSelectedIndex(0);
      setSelectionAnchor(null);
      setBatchSelection(new Set());
      setIsDirty(false);
      setLastSavedState(null);
    },
    [resetEditorState]
  );

  return {
    characters: editorState.characters,
    config: editorState.config,
    selectedIndex,
    setSelectedIndex,
    batchSelection,
    toggleBatchSelection,
    clearBatchSelection,
    selectAll,
    toggleSelectedPixel,
    setSelectedPixel,
    getSelectedPixelState,
    rotateSelected,
    shiftSelected,
    invertSelected,
    flipSelectedHorizontal,
    flipSelectedVertical,
    clearSelected,
    fillSelected,
    centerSelected,
    scaleSelected,
    selectedIndices,
    addCharacter,
    addCharacters,
    deleteSelected,
    copyCharacter,
    resizeCharacters,
    updateCharacter,
    setCharacters,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    markSaved,
    reset,
    history,
    historyIndex,
    jumpToHistory,
    totalHistoryEntries,
    startBatch,
    endBatch,
  };
}
