/**
 * Character ROM Editor - CRT Simulation Settings
 *
 * Settings for simulating classic CRT display effects in the text preview.
 * Includes scanlines, screen curvature, bloom/glow, and pixel aspect ratio
 * for PAL/NTSC simulation.
 *
 * @module lib/character-editor/data/crtSettings
 */

import { CHARACTER_EDITOR_STORAGE_KEY_CRT_SETTINGS } from "../storage/keys";

/**
 * Pixel aspect ratio presets for different video standards
 */
export type PixelAspectRatio = "none" | "pal" | "ntsc";

/**
 * CRT simulation settings
 */
export interface CRTSettings {
  /** Whether scanlines effect is enabled */
  scanlines: boolean;
  /** Scanlines intensity (0-100) */
  scanlinesIntensity: number;
  /** Whether screen curvature effect is enabled */
  curvature: boolean;
  /** Curvature amount (0-100) */
  curvatureAmount: number;
  /** Whether bloom/glow effect is enabled */
  bloom: boolean;
  /** Bloom intensity (0-100) */
  bloomIntensity: number;
  /** Pixel aspect ratio preset */
  pixelAspectRatio: PixelAspectRatio;
}

/**
 * Default CRT settings (bloom enabled for authentic CRT look)
 */
export const DEFAULT_CRT_SETTINGS: CRTSettings = {
  scanlines: false,
  scanlinesIntensity: 50,
  curvature: false,
  curvatureAmount: 30,
  bloom: true,
  bloomIntensity: 40,
  pixelAspectRatio: "none",
};

/**
 * Pixel aspect ratio scale values
 * - PAL: ~1.09:1 (wider pixels)
 * - NTSC: ~0.93:1 (taller pixels)
 */
export const PIXEL_ASPECT_RATIOS: Record<PixelAspectRatio, number> = {
  none: 1.0,
  pal: 1.09,
  ntsc: 0.93,
};

/**
 * Pixel aspect ratio display labels
 */
export const PIXEL_ASPECT_RATIO_LABELS: Record<PixelAspectRatio, string> = {
  none: "Square (1:1)",
  pal: "PAL (1.09:1)",
  ntsc: "NTSC (0.93:1)",
};

/**
 * Save CRT settings to localStorage
 */
export function saveCRTSettings(settings: CRTSettings): void {
  try {
    localStorage.setItem(CHARACTER_EDITOR_STORAGE_KEY_CRT_SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get saved CRT settings from localStorage
 */
export function getCRTSettings(): CRTSettings {
  try {
    const saved = localStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_CRT_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle any missing fields
      return { ...DEFAULT_CRT_SETTINGS, ...parsed };
    }
  } catch {
    // Ignore errors
  }
  return { ...DEFAULT_CRT_SETTINGS };
}

