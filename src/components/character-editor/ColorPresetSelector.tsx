"use client";

import { useState, useCallback } from "react";
import {
  COLOR_PRESETS,
  ColorPreset,
  CustomColors,
  getPresetById,
  getSavedPresetId,
  saveSelectedPreset,
  getCustomColors,
  saveCustomColors,
} from "@/lib/character-editor/colorPresets";
import { useOutsideClick } from "@/hooks/useOutsideClick";

export interface ColorPresetSelectorProps {
  /** Current colors */
  colors: CustomColors;
  /** Callback when colors change */
  onColorsChange: (colors: CustomColors) => void;
  /** Additional CSS classes */
  className?: string;
  /** Open dropdown upward instead of downward */
  dropUp?: boolean;
}

/**
 * Color preset selector dropdown
 */
export function ColorPresetSelector({
  colors,
  onColorsChange,
  className = "",
  dropUp = false,
}: ColorPresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState(() => getSavedPresetId());
  const [customColors, setCustomColors] = useState<CustomColors>(() => getCustomColors());
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const dropdownRef = useOutsideClick<HTMLDivElement>(() => {
    setIsOpen(false);
    setShowCustomPicker(false);
  }, isOpen);

  const handlePresetSelect = useCallback(
    (preset: ColorPreset) => {
      if (preset.id === "custom") {
        setShowCustomPicker(true);
        return;
      }

      setSelectedPresetId(preset.id);
      saveSelectedPreset(preset.id);
      onColorsChange({
        foreground: preset.foreground,
        background: preset.background,
        gridColor: preset.gridColor,
      });
      setIsOpen(false);
    },
    [onColorsChange]
  );

  const handleCustomColorChange = useCallback(
    (key: keyof CustomColors, value: string) => {
      const newColors = { ...customColors, [key]: value };
      setCustomColors(newColors);
      saveCustomColors(newColors);
      setSelectedPresetId("custom");
      saveSelectedPreset("custom");
      onColorsChange(newColors);
    },
    [customColors, onColorsChange]
  );

  const currentPreset = getPresetById(selectedPresetId);
  const displayName = currentPreset?.name || "Custom";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-300 hover:border-retro-grid transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Color preview */}
        <div className="flex gap-0.5">
          <div
            className="w-3 h-3 rounded-sm border border-white/20"
            style={{ backgroundColor: colors.foreground }}
          />
          <div
            className="w-3 h-3 rounded-sm border border-white/20"
            style={{ backgroundColor: colors.background }}
          />
        </div>
        <span className="hidden sm:inline">{displayName}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 w-64 bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl z-50 overflow-hidden ${dropUp ? "bottom-full mb-1" : "mt-1"}`}>
          {showCustomPicker ? (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Custom Colors</span>
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Back
                </button>
              </div>

              {/* Foreground color */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Foreground
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.foreground}
                    onChange={(e) =>
                      handleCustomColorChange("foreground", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customColors.foreground}
                    onChange={(e) =>
                      handleCustomColorChange("foreground", e.target.value)
                    }
                    className="flex-1 px-2 py-1 bg-retro-dark border border-retro-grid/50 rounded text-xs text-gray-300 font-mono"
                  />
                </div>
              </div>

              {/* Background color */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.background}
                    onChange={(e) =>
                      handleCustomColorChange("background", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customColors.background}
                    onChange={(e) =>
                      handleCustomColorChange("background", e.target.value)
                    }
                    className="flex-1 px-2 py-1 bg-retro-dark border border-retro-grid/50 rounded text-xs text-gray-300 font-mono"
                  />
                </div>
              </div>

              {/* Grid color */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Grid Lines
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.gridColor}
                    onChange={(e) =>
                      handleCustomColorChange("gridColor", e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customColors.gridColor}
                    onChange={(e) =>
                      handleCustomColorChange("gridColor", e.target.value)
                    }
                    className="flex-1 px-2 py-1 bg-retro-dark border border-retro-grid/50 rounded text-xs text-gray-300 font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-1 max-h-80 overflow-y-auto">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-left text-sm
                    transition-colors
                    ${
                      selectedPresetId === preset.id
                        ? "bg-retro-cyan/10 text-retro-cyan"
                        : "text-gray-300 hover:bg-retro-purple/20"
                    }
                  `}
                  role="option"
                  aria-selected={selectedPresetId === preset.id}
                >
                  {/* Color swatches */}
                  {preset.id !== "custom" ? (
                    <div className="flex gap-0.5 flex-shrink-0">
                      <div
                        className="w-4 h-4 rounded-sm border border-white/20"
                        style={{ backgroundColor: preset.foreground }}
                      />
                      <div
                        className="w-4 h-4 rounded-sm border border-white/20"
                        style={{ backgroundColor: preset.background }}
                      />
                    </div>
                  ) : (
                    <div className="w-[34px] h-4 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                        />
                      </svg>
                    </div>
                  )}

                  <span className="flex-1">{preset.name}</span>

                  {selectedPresetId === preset.id && (
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
