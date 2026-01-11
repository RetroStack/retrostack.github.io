/**
 * Character Set Similarity Utilities
 *
 * Functions for comparing character sets and calculating similarity scores.
 * Used by the Similar Characters modal to find and rank character sets
 * by their visual similarity to the current character set.
 *
 * @module lib/character-editor/similarity
 */

import {
  Character,
  CharacterSetConfig,
  CharacterSetMetadata,
  SerializedCharacterSet,
} from "./types";
import { getBoundingBox } from "./transforms";
import { deserializeCharacterSet } from "./import/binary";

/**
 * Result of comparing two character sets
 */
export interface CharacterSetSimilarity {
  /** ID of the compared character set */
  characterSetId: string;
  /** Name of the compared character set */
  characterSetName: string;
  /** Full metadata of the compared set */
  metadata: CharacterSetMetadata;
  /** Configuration of the compared set */
  config: CharacterSetConfig;
  /** Average difference per compared character (lower = more similar) */
  averageDifference: number;
  /** Number of characters that could be compared (min of both sets) */
  matchedCharacters: number;
  /** Total characters in the compared set */
  totalCharacters: number;
  /** Match percentage (0-100, higher = more similar) */
  matchPercentage: number;
  /** The deserialized characters for preview */
  characters: Character[];
}

/**
 * Result of comparing two individual characters
 */
export interface CharacterComparisonResult {
  /** Number of pixels that differ between the two trimmed characters */
  differingPixels: number;
  /** Total number of pixels compared */
  totalPixels: number;
}

/**
 * Trim empty rows and columns from around a character
 *
 * Removes all empty (false) rows and columns from the edges,
 * leaving only the "content" area of the character.
 *
 * @param character - The character to trim
 * @returns A new character with only the content area, or empty 1x1 if all empty
 */
export function trimCharacter(character: Character): Character {
  const bbox = getBoundingBox(character);

  // If character is completely empty, return a minimal empty character
  if (!bbox) {
    return { pixels: [[false]] };
  }

  // Extract only the pixels within the bounding box
  const trimmedPixels: boolean[][] = [];
  for (let row = bbox.minRow; row <= bbox.maxRow; row++) {
    const newRow: boolean[] = [];
    for (let col = bbox.minCol; col <= bbox.maxCol; col++) {
      newRow.push(character.pixels[row][col]);
    }
    trimmedPixels.push(newRow);
  }

  return { pixels: trimmedPixels };
}

/**
 * Compare two characters after trimming them
 *
 * Both characters are trimmed to their content areas, then compared.
 * If sizes differ, the smaller one is conceptually padded with false
 * to match the larger dimensions.
 *
 * @param sourceChar - First character to compare
 * @param targetChar - Second character to compare
 * @returns Comparison result with differing and total pixel counts
 */
export function compareTrimmedCharacters(
  sourceChar: Character,
  targetChar: Character
): CharacterComparisonResult {
  const sourceTrimmed = trimCharacter(sourceChar);
  const targetTrimmed = trimCharacter(targetChar);

  const sourceHeight = sourceTrimmed.pixels.length;
  const sourceWidth = sourceTrimmed.pixels[0]?.length || 0;
  const targetHeight = targetTrimmed.pixels.length;
  const targetWidth = targetTrimmed.pixels[0]?.length || 0;

  // Use max dimensions for comparison
  const maxHeight = Math.max(sourceHeight, targetHeight);
  const maxWidth = Math.max(sourceWidth, targetWidth);

  // Calculate centering offsets for both characters
  const sourceRowOffset = Math.floor((maxHeight - sourceHeight) / 2);
  const sourceColOffset = Math.floor((maxWidth - sourceWidth) / 2);
  const targetRowOffset = Math.floor((maxHeight - targetHeight) / 2);
  const targetColOffset = Math.floor((maxWidth - targetWidth) / 2);

  let differingPixels = 0;
  const totalPixels = maxHeight * maxWidth;

  for (let row = 0; row < maxHeight; row++) {
    for (let col = 0; col < maxWidth; col++) {
      // Get source pixel (or false if outside bounds)
      const sourceRow = row - sourceRowOffset;
      const sourceCol = col - sourceColOffset;
      const sourcePixel =
        sourceRow >= 0 &&
        sourceRow < sourceHeight &&
        sourceCol >= 0 &&
        sourceCol < sourceWidth
          ? sourceTrimmed.pixels[sourceRow][sourceCol]
          : false;

      // Get target pixel (or false if outside bounds)
      const targetRow = row - targetRowOffset;
      const targetCol = col - targetColOffset;
      const targetPixel =
        targetRow >= 0 &&
        targetRow < targetHeight &&
        targetCol >= 0 &&
        targetCol < targetWidth
          ? targetTrimmed.pixels[targetRow][targetCol]
          : false;

      if (sourcePixel !== targetPixel) {
        differingPixels++;
      }
    }
  }

  return { differingPixels, totalPixels };
}

/**
 * Calculate similarity scores for all character sets in a library
 *
 * Compares the source characters against each character set in the library,
 * calculating an average difference score. Results are sorted by similarity
 * (most similar first).
 *
 * @param sourceCharacters - The current character set's characters
 * @param sourceConfig - Configuration of the source character set
 * @param librarySets - All serialized character sets from the library
 * @param excludeId - Optional ID to exclude (usually the current set)
 * @returns Array of similarity results, sorted by most similar first
 */
export function calculateSimilarities(
  sourceCharacters: Character[],
  sourceConfig: CharacterSetConfig,
  librarySets: SerializedCharacterSet[],
  excludeId?: string
): CharacterSetSimilarity[] {
  const results: CharacterSetSimilarity[] = [];

  for (const serializedSet of librarySets) {
    // Skip the excluded set
    if (excludeId && serializedSet.metadata.id === excludeId) {
      continue;
    }

    try {
      // Deserialize to get actual characters
      const targetSet = deserializeCharacterSet(serializedSet);
      const targetCharacters = targetSet.characters;

      // Compare characters by index
      const compareCount = Math.min(
        sourceCharacters.length,
        targetCharacters.length
      );

      if (compareCount === 0) {
        // Skip empty sets
        continue;
      }

      let totalDifference = 0;
      let totalPixels = 0;

      for (let i = 0; i < compareCount; i++) {
        const result = compareTrimmedCharacters(
          sourceCharacters[i],
          targetCharacters[i]
        );
        totalDifference += result.differingPixels;
        totalPixels += result.totalPixels;
      }

      const averageDifference = totalDifference / compareCount;

      // Calculate match percentage
      // 100% = identical, 0% = completely different
      // Use floor to avoid showing 100% when there are slight differences
      const matchPercentage =
        totalPixels > 0
          ? Math.floor((1 - totalDifference / totalPixels) * 100)
          : 100;

      results.push({
        characterSetId: serializedSet.metadata.id,
        characterSetName: serializedSet.metadata.name,
        metadata: serializedSet.metadata,
        config: serializedSet.config,
        averageDifference,
        matchedCharacters: compareCount,
        totalCharacters: targetCharacters.length,
        matchPercentage,
        characters: targetCharacters,
      });
    } catch (error) {
      // Skip sets that fail to deserialize
      console.error(
        `Failed to deserialize character set ${serializedSet.metadata.id}:`,
        error
      );
      continue;
    }
  }

  // Sort by average difference (most similar first)
  results.sort((a, b) => a.averageDifference - b.averageDifference);

  return results;
}
