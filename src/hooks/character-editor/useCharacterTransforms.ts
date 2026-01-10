/**
 * Character Transform Operations Hook
 *
 * Provides all pixel-level and character-level transformations:
 * - Pixel operations: toggle, set, get state (for batch editing)
 * - Rotate: 90° left or right
 * - Shift: up/down/left/right with optional wrap
 * - Flip: horizontal or vertical mirroring
 * - Invert: toggle all pixels
 * - Clear/Fill: all pixels off or on
 * - Center: auto-center content within bounds
 * - Scale: enlarge/shrink with anchor positioning
 *
 * All operations support batch editing on multiple selected characters.
 * Works with the undo/redo system via the updateState callback.
 *
 * @module hooks/character-editor/useCharacterTransforms
 */
"use client";

import { useCallback } from "react";
import {
  Character,
  CharacterSetConfig,
  AnchorPoint,
  createEmptyCharacter,
} from "@/lib/character-editor/types";
import {
  togglePixel,
  setPixel,
  rotateCharacter,
  shiftCharacter,
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

export interface EditorState {
  characters: Character[];
  config: CharacterSetConfig;
}

export interface UseCharacterTransformsOptions {
  /** Update state function from undo/redo hook */
  updateState: (updater: (state: EditorState) => EditorState, label?: string) => void;
  /** Combined set of selected indices */
  selectedIndices: Set<number>;
  /** Primary selected index */
  selectedIndex: number;
  /** Current characters (for read operations) */
  characters: Character[];
}

export interface UseCharacterTransformsResult {
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
}

/**
 * Hook for character transform operations
 *
 * Provides all transform operations (rotate, flip, shift, etc.) that work
 * on selected characters with batch support.
 */
export function useCharacterTransforms({
  updateState,
  selectedIndices,
  selectedIndex,
  characters,
}: UseCharacterTransformsOptions): UseCharacterTransformsResult {
  const toggleSelectedPixel = useCallback(
    (row: number, col: number) => {
      updateState((state) => {
        if (selectedIndices.size > 1) {
          // Batch toggle
          state.characters = batchTogglePixel(state.characters, selectedIndices, row, col);
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
      return getPixelState(characters, selectedIndices, row, col);
    },
    [characters, selectedIndices]
  );

  const rotateSelected = useCallback(
    (direction: "left" | "right") => {
      updateState((state) => {
        state.characters = batchTransform(state.characters, selectedIndices, (char) =>
          rotateCharacter(char, direction)
        );
        return state;
      });
    },
    [updateState, selectedIndices]
  );

  const shiftSelected = useCallback(
    (direction: "up" | "down" | "left" | "right", wrap: boolean = true) => {
      updateState((state) => {
        state.characters = batchTransform(state.characters, selectedIndices, (char) =>
          shiftCharacter(char, direction, wrap)
        );
        return state;
      });
    },
    [updateState, selectedIndices]
  );

  const invertSelected = useCallback(() => {
    updateState((state) => {
      state.characters = batchTransform(state.characters, selectedIndices, invertCharacter);
      return state;
    });
  }, [updateState, selectedIndices]);

  const flipSelectedHorizontal = useCallback(() => {
    updateState((state) => {
      state.characters = batchTransform(state.characters, selectedIndices, flipHorizontal);
      return state;
    });
  }, [updateState, selectedIndices]);

  const flipSelectedVertical = useCallback(() => {
    updateState((state) => {
      state.characters = batchTransform(state.characters, selectedIndices, flipVertical);
      return state;
    });
  }, [updateState, selectedIndices]);

  const clearSelected = useCallback(() => {
    updateState((state) => {
      const { width, height } = state.config;
      state.characters = batchTransform(state.characters, selectedIndices, () =>
        createEmptyCharacter(width, height)
      );
      return state;
    });
  }, [updateState, selectedIndices]);

  const fillSelected = useCallback(() => {
    updateState((state) => {
      const { width, height } = state.config;
      state.characters = batchTransform(state.characters, selectedIndices, () => ({
        pixels: Array.from({ length: height }, () => Array(width).fill(true)),
      }));
      return state;
    });
  }, [updateState, selectedIndices]);

  const centerSelected = useCallback(() => {
    updateState((state) => {
      state.characters = batchTransform(state.characters, selectedIndices, centerCharacter);
      return state;
    });
  }, [updateState, selectedIndices]);

  const scaleSelected = useCallback(
    (scale: number, anchor: AnchorPoint, algorithm: ScaleAlgorithm) => {
      updateState((state) => {
        state.characters = batchTransform(state.characters, selectedIndices, (char) =>
          scaleCharacter(char, scale, anchor, algorithm)
        );
        return state;
      });
    },
    [updateState, selectedIndices]
  );

  return {
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
  };
}
