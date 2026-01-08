"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  CharacterCountPresetWithExamples,
  UNIFIED_CHARACTER_COUNT_PRESETS,
} from "@/lib/character-editor/presets";
import {
  getSystemCharacterCountPresetsByManufacturer,
  getRomChipCharacterCountPresetsByManufacturer,
} from "@/lib/character-editor/data/manufacturers";

const BUTTON_WIDTH = 48; // Approximate width of a preset button
const DROPDOWN_BUTTON_WIDTH = 56; // Width of "More" button
const GAP = 8; // Gap between buttons

export interface CharacterCountPresetSelectorProps {
  /** Current character count */
  currentCount: number;
  /** Callback when a preset is selected */
  onSelect: (count: number) => void;
  /** Which presets to show (defaults to all unified presets) */
  presets?: CharacterCountPresetWithExamples[];
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Reusable component for selecting character count presets
 * Shows presets adaptively based on available space, with overflow in dropdown
 *
 * Used in:
 * - AddView (new character set wizard)
 * - CharacterCountPresetDropdown
 */
export function CharacterCountPresetSelector({
  currentCount,
  onSelect,
  presets = UNIFIED_CHARACTER_COUNT_PRESETS,
  disabled = false,
  className = "",
}: CharacterCountPresetSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(presets.length);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sort presets by priority (highest first) for determining which to show
  const sortedByPriority = [...presets].sort((a, b) => b.priority - a.priority);

  // Calculate how many presets can fit
  const calculateVisibleCount = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    // Always reserve space for the dropdown button
    const availableWidth = containerWidth - DROPDOWN_BUTTON_WIDTH - GAP;
    const maxVisible = Math.floor((availableWidth + GAP) / (BUTTON_WIDTH + GAP));

    // At minimum show 2 presets
    setVisibleCount(Math.max(2, Math.min(maxVisible, presets.length)));
  }, [presets.length]);

  useEffect(() => {
    calculateVisibleCount();

    const observer = new ResizeObserver(() => {
      calculateVisibleCount();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [calculateVisibleCount]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get system presets grouped by manufacturer
  const systemPresetsByManufacturer = getSystemCharacterCountPresetsByManufacturer();

  // Get ROM chip presets grouped by manufacturer
  const romChipPresetsByManufacturer = getRomChipCharacterCountPresetsByManufacturer();

  const isSelected = (preset: CharacterCountPresetWithExamples) =>
    currentCount === preset.count;

  const isCurrentCount = (count: number) => currentCount === count;

  const handleSelect = (preset: CharacterCountPresetWithExamples) => {
    onSelect(preset.count);
    setIsDropdownOpen(false);
  };

  // Determine which presets are visible vs in dropdown based on priority
  const visiblePresets: CharacterCountPresetWithExamples[] = [];
  const overflowPresets: CharacterCountPresetWithExamples[] = [];

  // Get the top N presets by priority to show
  const topPriorityLabels = new Set(
    sortedByPriority.slice(0, visibleCount).map((p) => p.label)
  );

  // Maintain original order but split into visible vs overflow
  for (const preset of presets) {
    if (topPriorityLabels.has(preset.label)) {
      visiblePresets.push(preset);
    } else {
      overflowPresets.push(preset);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex flex-wrap gap-2">
        {/* Visible preset buttons */}
        {visiblePresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handleSelect(preset)}
            disabled={disabled}
            title={
              preset.description
                ? preset.examples.length > 0
                  ? `${preset.description} - ${preset.examples.join(", ")}`
                  : preset.description
                : preset.examples.length > 0
                  ? preset.examples.join(", ")
                  : undefined
            }
            className={`
              px-3 py-1 text-xs rounded border transition-colors
              ${
                isSelected(preset)
                  ? "border-retro-pink bg-retro-pink/10 text-retro-pink"
                  : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
              }
              disabled:opacity-50
            `}
          >
            {preset.label}
          </button>
        ))}

        {/* Dropdown toggle - always shown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className="px-3 py-1 text-xs rounded text-retro-cyan bg-gradient-to-b from-gray-600/50 to-gray-700/50 border border-retro-cyan/50 border-t-retro-cyan/70 hover:from-gray-500/50 hover:to-gray-600/50 hover:border-retro-cyan active:from-gray-700/50 active:to-gray-800/50 shadow-md shadow-black/30 active:shadow-sm flex items-center gap-1 transition-all disabled:opacity-50"
          >
            More
            <svg
              className={`w-3 h-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
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

          {/* Dropdown panel */}
          {isDropdownOpen && (
            <div className="absolute z-50 left-0 top-full mt-1 w-72 max-h-96 overflow-y-auto bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl">
              {/* Other Counts section (overflow presets) */}
              {overflowPresets.length > 0 && (
                <div className="p-2 border-b border-retro-grid/30">
                  <div className="text-[10px] text-gray-500 uppercase mb-1">
                    Other Counts
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {overflowPresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleSelect(preset)}
                        disabled={disabled}
                        title={preset.description}
                        className={`
                          px-2 py-1 text-xs rounded transition-colors
                          ${
                            isSelected(preset)
                              ? "bg-retro-pink/20 text-retro-pink"
                              : "text-gray-400 hover:bg-retro-grid/20"
                          }
                          disabled:opacity-50
                        `}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Systems section header */}
              {Object.keys(systemPresetsByManufacturer).length > 0 && (
                <div className="px-2 pt-2 pb-1">
                  <div className="text-[10px] text-retro-cyan uppercase font-medium">
                    Systems
                  </div>
                </div>
              )}

              {/* Systems section - organized by manufacturer */}
              {Object.entries(systemPresetsByManufacturer)
                .filter(([, systemPresets]) => systemPresets.length > 0)
                .map(([manufacturer, systemPresets]) => (
                  <div
                    key={manufacturer}
                    className="px-2 pb-2"
                  >
                    <div className="text-[10px] text-gray-500 uppercase mb-1">
                      {manufacturer}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {systemPresets.map((systemPreset) => (
                        <button
                          key={`${systemPreset.system}-${systemPreset.count}`}
                          onClick={() => {
                            onSelect(systemPreset.count);
                            setIsDropdownOpen(false);
                          }}
                          disabled={disabled}
                          title={`${systemPreset.count} characters`}
                          className={`
                            px-2 py-1 text-xs rounded transition-colors
                            ${
                              isCurrentCount(systemPreset.count)
                                ? "bg-retro-amber/20 text-retro-amber"
                                : "text-gray-400 hover:bg-retro-grid/20"
                            }
                            disabled:opacity-50
                          `}
                        >
                          {systemPreset.system}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              {/* Divider between Systems and ROM ICs */}
              {Object.keys(romChipPresetsByManufacturer).length > 0 && (
                <div className="border-t border-retro-grid/30" />
              )}

              {/* Character ROM ICs section header */}
              {Object.keys(romChipPresetsByManufacturer).length > 0 && (
                <div className="px-2 pt-2 pb-1">
                  <div className="text-[10px] text-retro-cyan uppercase font-medium">
                    Character ROM ICs
                  </div>
                </div>
              )}

              {/* ROM ICs section - organized by manufacturer */}
              {Object.entries(romChipPresetsByManufacturer)
                .filter(([, chipPresets]) => chipPresets.length > 0)
                .map(([manufacturer, chipPresets]) => (
                  <div
                    key={`rom-${manufacturer}`}
                    className="px-2 pb-2"
                  >
                    <div className="text-[10px] text-gray-500 uppercase mb-1">
                      {manufacturer}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {chipPresets.map((chipPreset) => (
                        <button
                          key={`${chipPreset.id}-${chipPreset.count}`}
                          onClick={() => {
                            onSelect(chipPreset.count);
                            setIsDropdownOpen(false);
                          }}
                          disabled={disabled}
                          title={
                            chipPreset.usedIn.length > 0
                              ? `${chipPreset.count} chars - Used in: ${chipPreset.usedIn.join(", ")}`
                              : `${chipPreset.count} characters`
                          }
                          className={`
                            px-2 py-1 text-xs rounded transition-colors
                            ${
                              isCurrentCount(chipPreset.count)
                                ? "bg-retro-purple/20 text-retro-purple"
                                : "text-gray-400 hover:bg-retro-grid/20"
                            }
                            disabled:opacity-50
                          `}
                        >
                          {chipPreset.partNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
