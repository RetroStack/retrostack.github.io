/**
 * Character ROM Editor - Color Presets
 *
 * Classic retro color schemes for character display.
 */

export interface ColorPreset {
  id: string;
  name: string;
  foreground: string;
  background: string;
  gridColor: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "classic",
    name: "White Phosphor",
    foreground: "#ffffff",
    background: "#000000",
    gridColor: "#333333",
  },
  {
    id: "green",
    name: "Green Phosphor",
    foreground: "#33ff33",
    background: "#001100",
    gridColor: "#004400",
  },
  {
    id: "amber",
    name: "Amber Phosphor",
    foreground: "#ffb000",
    background: "#1a0a00",
    gridColor: "#4d2e00",
  },
  {
    id: "c64-blue",
    name: "C64 Blue",
    foreground: "#6c5eb5",
    background: "#40318d",
    gridColor: "#2e2266",
  },
  {
    id: "c64-cyan",
    name: "C64 Light Blue",
    foreground: "#70a4b2",
    background: "#352879",
    gridColor: "#493f99",
  },
  {
    id: "apple-green",
    name: "Apple II Green",
    foreground: "#14f53c",
    background: "#000000",
    gridColor: "#0a4d15",
  },
  {
    id: "zx-spectrum",
    name: "ZX Spectrum",
    foreground: "#ffffff",
    background: "#0000d7",
    gridColor: "#0000aa",
  },
  {
    id: "ibm-cga",
    name: "IBM CGA Cyan",
    foreground: "#55ffff",
    background: "#000000",
    gridColor: "#005555",
  },
  {
    id: "vt100",
    name: "VT100",
    foreground: "#00ff00",
    background: "#000000",
    gridColor: "#003300",
  },
  {
    id: "custom",
    name: "Custom...",
    foreground: "",
    background: "",
    gridColor: "",
  },
];

const COLOR_PRESET_STORAGE_KEY = "character-editor-color-preset";
const CUSTOM_COLORS_STORAGE_KEY = "character-editor-custom-colors";

export interface CustomColors {
  foreground: string;
  background: string;
  gridColor: string;
}

/**
 * Get the default preset
 */
export function getDefaultPreset(): ColorPreset {
  return COLOR_PRESETS[0];
}

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): ColorPreset | undefined {
  return COLOR_PRESETS.find((p) => p.id === id);
}

/**
 * Save the selected preset ID to localStorage
 */
export function saveSelectedPreset(presetId: string): void {
  try {
    localStorage.setItem(COLOR_PRESET_STORAGE_KEY, presetId);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get the saved preset ID from localStorage
 */
export function getSavedPresetId(): string {
  try {
    return localStorage.getItem(COLOR_PRESET_STORAGE_KEY) || "classic";
  } catch {
    return "classic";
  }
}

/**
 * Save custom colors to localStorage
 */
export function saveCustomColors(colors: CustomColors): void {
  try {
    localStorage.setItem(CUSTOM_COLORS_STORAGE_KEY, JSON.stringify(colors));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get saved custom colors from localStorage
 */
export function getCustomColors(): CustomColors {
  try {
    const saved = localStorage.getItem(CUSTOM_COLORS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore errors
  }
  return {
    foreground: "#ffffff",
    background: "#000000",
    gridColor: "#333333",
  };
}

/**
 * Get the current active colors based on saved preset
 */
export function getActiveColors(): CustomColors {
  const presetId = getSavedPresetId();

  if (presetId === "custom") {
    return getCustomColors();
  }

  const preset = getPresetById(presetId);
  if (preset) {
    return {
      foreground: preset.foreground,
      background: preset.background,
      gridColor: preset.gridColor,
    };
  }

  // Fallback to classic
  return {
    foreground: "#ffffff",
    background: "#000000",
    gridColor: "#333333",
  };
}
