"use client";

import { useState, useMemo, useCallback } from "react";
import type { PaddingDirection, BitDirection } from "@/lib/character-editor/types";
import {
  BINARY_EXPORT_SYSTEM_PRESETS,
  CHIP_BINARY_EXPORT_PRESETS,
  type BinaryExportSystemPreset,
  type ChipBinaryExportPreset,
  getBinaryExportPresetsByManufacturer,
  getChipBinaryExportPresetsByManufacturer,
  getSystemByName,
  ROM_CHIPS,
} from "@/lib/character-editor/data/systems";
import { useDropdown } from "@/hooks/useDropdown";
import {
  DropdownPanel,
  DropdownGroup,
  DropdownChipButton,
  DropdownClearButton,
  Picker3DButton,
  pickerInputClasses,
} from "@/components/ui/DropdownPrimitives";
import { PaddingDirectionSelector } from "./PaddingDirectionSelector";
import { BitDirectionSelector } from "./BitDirectionSelector";

export interface BinaryFormatSectionProps {
  /** Current padding direction */
  padding: PaddingDirection;
  /** Current bit direction */
  bitDirection: BitDirection;
  /** Callback when padding changes */
  onPaddingChange: (padding: PaddingDirection) => void;
  /** Callback when bit direction changes */
  onBitDirectionChange: (bitDirection: BitDirection) => void;
  /** Initial chip/character generator name to pre-select (higher priority than system) */
  initialChipName?: string;
  /** Initial system name to pre-select (from character set metadata) */
  initialSystemName?: string;
  /** Whether the section is disabled */
  disabled?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Combined binary format section with system/chip preset selector and collapsible custom options.
 *
 * - Primary UI: System/chip preset dropdown to select a target system or character generator
 * - Secondary UI: Collapsible "Bit Settings" section for manual padding/bit direction
 * - When a preset is selected, both padding and bit direction are set automatically
 * - When custom values differ from selected preset, shows "Custom" in the input
 *
 * Used in:
 * - ExportView (binary and code export)
 */

/** Union type for selected preset - can be system or chip */
type SelectedPreset =
  | { type: "system"; preset: BinaryExportSystemPreset }
  | { type: "chip"; preset: ChipBinaryExportPreset };

/**
 * Find a chip preset by chip/character generator name.
 */
function findChipPresetByName(chipName: string): ChipBinaryExportPreset | undefined {
  if (!chipName) return undefined;
  const lowerName = chipName.toLowerCase();

  // Find the chip by part number (exact or partial match)
  return CHIP_BINARY_EXPORT_PRESETS.find(
    (c) =>
      c.partNumber.toLowerCase() === lowerName ||
      c.partNumber.toLowerCase().includes(lowerName) ||
      lowerName.includes(c.partNumber.toLowerCase())
  );
}

/**
 * Find a system preset by chip/character generator name.
 * Looks up which systems use this chip and returns the first matching preset.
 */
function findSystemPresetByChipName(chipName: string): BinaryExportSystemPreset | undefined {
  if (!chipName) return undefined;
  const lowerName = chipName.toLowerCase();

  // Find the chip by part number (exact or partial match)
  const chip = ROM_CHIPS.find(
    (c) =>
      c.partNumber.toLowerCase() === lowerName ||
      c.partNumber.toLowerCase().includes(lowerName) ||
      lowerName.includes(c.partNumber.toLowerCase())
  );

  if (chip && chip.usedIn && chip.usedIn.length > 0) {
    // Find the first system that uses this chip
    for (const systemName of chip.usedIn) {
      const preset = BINARY_EXPORT_SYSTEM_PRESETS.find(
        (p) => p.name.toLowerCase() === systemName.toLowerCase()
      );
      if (preset) return preset;
    }
  }

  return undefined;
}

/**
 * Find a preset by system name (case-insensitive, supports alternate names)
 */
function findPresetBySystemName(systemName: string): BinaryExportSystemPreset | undefined {
  if (!systemName) return undefined;

  // Use the system lookup which supports alternate names
  const system = getSystemByName(systemName);
  if (system) {
    const preset = BINARY_EXPORT_SYSTEM_PRESETS.find((p) => p.id === system.id);
    if (preset) return preset;
  }

  // Fallback: try direct name matching
  const lowerName = systemName.toLowerCase();
  let preset = BINARY_EXPORT_SYSTEM_PRESETS.find((p) => p.name.toLowerCase() === lowerName);
  if (preset) return preset;

  // Try partial match (system name contains the search term or vice versa)
  preset = BINARY_EXPORT_SYSTEM_PRESETS.find(
    (p) => p.name.toLowerCase().includes(lowerName) || lowerName.includes(p.name.toLowerCase())
  );
  return preset;
}

/**
 * Find initial selection: chip preset first, then system preset by chip, then system preset by name
 */
function findInitialSelection(chipName?: string, systemName?: string): { type: "system" | "chip"; id: string } | null {
  // First try to find a chip preset directly
  if (chipName) {
    const chipPreset = findChipPresetByName(chipName);
    if (chipPreset) {
      return { type: "chip", id: chipPreset.id };
    }

    // Try to find a system that uses this chip
    const systemPreset = findSystemPresetByChipName(chipName);
    if (systemPreset) {
      return { type: "system", id: systemPreset.id };
    }
  }

  // Fall back to system name
  if (systemName) {
    const preset = findPresetBySystemName(systemName);
    if (preset) {
      return { type: "system", id: preset.id };
    }
  }

  return null;
}

export function BinaryFormatSection({
  padding,
  bitDirection,
  onPaddingChange,
  onBitDirectionChange,
  initialChipName,
  initialSystemName,
  disabled = false,
  className = "",
}: BinaryFormatSectionProps) {
  const { ref: dropdownRef, isOpen, toggle, close } = useDropdown<HTMLDivElement>();
  const [customExpanded, setCustomExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Wrapper for toggle that clears search when opening
  const handleToggle = useCallback(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
    toggle();
  }, [isOpen, toggle]);

  // Track the selected preset (type + id)
  const [selection, setSelection] = useState<{ type: "system" | "chip"; id: string } | null>(() => {
    return findInitialSelection(initialChipName, initialSystemName);
  });

  // Get system presets grouped by manufacturer
  const systemGroups = useMemo(() => getBinaryExportPresetsByManufacturer(), []);

  // Get chip presets grouped by manufacturer
  const chipGroups = useMemo(() => getChipBinaryExportPresetsByManufacturer(), []);

  // Filter system groups based on search query
  const filteredSystemGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return systemGroups;
    }

    const query = searchQuery.toLowerCase().trim();

    return systemGroups
      .map((group) => {
        const manufacturerMatches = group.manufacturer.toLowerCase().includes(query);
        const matchingSystems = group.systems.filter(
          (preset) =>
            manufacturerMatches ||
            preset.name.toLowerCase().includes(query) ||
            preset.id.toLowerCase().includes(query)
        );

        if (matchingSystems.length === 0) {
          return null;
        }

        return {
          manufacturer: group.manufacturer,
          systems: matchingSystems,
        };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);
  }, [systemGroups, searchQuery]);

  // Filter chip groups based on search query
  const filteredChipGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return chipGroups;
    }

    const query = searchQuery.toLowerCase().trim();

    return chipGroups
      .map((group) => {
        const manufacturerMatches = group.manufacturer.toLowerCase().includes(query);
        const matchingChips = group.chips.filter(
          (preset) =>
            manufacturerMatches ||
            preset.partNumber.toLowerCase().includes(query) ||
            preset.id.toLowerCase().includes(query)
        );

        if (matchingChips.length === 0) {
          return null;
        }

        return {
          manufacturer: group.manufacturer,
          chips: matchingChips,
        };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);
  }, [chipGroups, searchQuery]);

  // Find the current preset based on selection
  const currentPreset = useMemo((): SelectedPreset | null => {
    if (!selection) return null;

    if (selection.type === "system") {
      const preset = BINARY_EXPORT_SYSTEM_PRESETS.find((p) => p.id === selection.id);
      if (preset && preset.padding === padding && preset.bitDirection === bitDirection) {
        return { type: "system", preset };
      }
    } else {
      const preset = CHIP_BINARY_EXPORT_PRESETS.find((p) => p.id === selection.id);
      if (preset && preset.padding === padding && preset.bitDirection === bitDirection) {
        return { type: "chip", preset };
      }
    }

    return null;
  }, [selection, padding, bitDirection]);

  // Display text for the input
  const displayText = useMemo(() => {
    if (!currentPreset) return "Custom";

    if (currentPreset.type === "system") {
      return `${currentPreset.preset.manufacturer} ${currentPreset.preset.name}`;
    } else {
      return `${currentPreset.preset.manufacturer} ${currentPreset.preset.partNumber}`;
    }
  }, [currentPreset]);

  // Close dropdown and clear search
  const closeDropdown = useCallback(() => {
    close();
    setSearchQuery("");
  }, [close]);

  const handleSystemPresetClick = useCallback(
    (preset: BinaryExportSystemPreset) => {
      setSelection({ type: "system", id: preset.id });
      onPaddingChange(preset.padding);
      onBitDirectionChange(preset.bitDirection);
      closeDropdown();
    },
    [onPaddingChange, onBitDirectionChange, closeDropdown]
  );

  const handleChipPresetClick = useCallback(
    (preset: ChipBinaryExportPreset) => {
      setSelection({ type: "chip", id: preset.id });
      onPaddingChange(preset.padding);
      onBitDirectionChange(preset.bitDirection);
      closeDropdown();
    },
    [onPaddingChange, onBitDirectionChange, closeDropdown]
  );

  const handleClear = useCallback(() => {
    // Reset to default (most common: right padding, MSB first)
    setSelection(null);
    onPaddingChange("right");
    onBitDirectionChange("msb");
    closeDropdown();
  }, [onPaddingChange, onBitDirectionChange, closeDropdown]);

  const toggleCustomSection = useCallback(() => {
    setCustomExpanded((prev) => !prev);
  }, []);

  const hasNoResults = filteredSystemGroups.length === 0 && filteredChipGroups.length === 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* System/chip preset selector */}
      <div>
        <h3 className="text-xs font-medium text-gray-400 mb-2">Target System / Character Generator</h3>
        <div className="flex gap-2">
          {/* Read-only display input */}
          <input
            type="text"
            value={displayText}
            readOnly
            disabled={disabled}
            className={pickerInputClasses}
            title="Select a target system or character generator from the picker"
          />

          {/* Picker dropdown */}
          <div ref={dropdownRef} className="relative flex-shrink-0">
            <Picker3DButton onClick={handleToggle} disabled={disabled} title="Select target system or chip" />

            {/* Dropdown panel */}
            {isOpen && (
              <DropdownPanel width={420} maxHeight={400}>
                {/* Search input - sticky at top */}
                <div className="sticky top-0 z-10 p-2 border-b border-retro-grid/30 bg-retro-navy">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search systems or chips..."
                    autoFocus
                    className="w-full px-3 py-1.5 text-sm bg-retro-dark border border-retro-grid/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
                  />
                </div>

                {/* Clear option - only show if not already default */}
                {(padding !== "right" || bitDirection !== "msb") && !searchQuery && (
                  <DropdownClearButton onClick={handleClear} label="Reset to default" />
                )}

                {/* Content area */}
                <div className="p-2">
                  {hasNoResults ? (
                    <div className="text-center text-gray-500 text-sm py-4">No systems or chips found</div>
                  ) : (
                    <>
                      {/* Character Generators section */}
                      {filteredChipGroups.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-semibold text-retro-cyan uppercase tracking-wider mb-2 px-1">
                            Character Generators
                          </div>
                          {filteredChipGroups.map((group) => (
                            <DropdownGroup key={`chip-${group.manufacturer}`} label={group.manufacturer}>
                              {group.chips.map((preset) => (
                                <DropdownChipButton
                                  key={preset.id}
                                  label={preset.partNumber}
                                  isSelected={
                                    currentPreset?.type === "chip" && currentPreset.preset.id === preset.id
                                  }
                                  onClick={() => handleChipPresetClick(preset)}
                                />
                              ))}
                            </DropdownGroup>
                          ))}
                        </div>
                      )}

                      {/* Systems section */}
                      {filteredSystemGroups.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-retro-pink uppercase tracking-wider mb-2 px-1">
                            Computer Systems
                          </div>
                          {filteredSystemGroups.map((group) => (
                            <DropdownGroup key={`system-${group.manufacturer}`} label={group.manufacturer}>
                              {group.systems.map((preset) => (
                                <DropdownChipButton
                                  key={preset.id}
                                  label={preset.name}
                                  isSelected={
                                    currentPreset?.type === "system" && currentPreset.preset.id === preset.id
                                  }
                                  onClick={() => handleSystemPresetClick(preset)}
                                />
                              ))}
                            </DropdownGroup>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </DropdownPanel>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible custom section */}
      <div className="border border-retro-grid/30 rounded bg-retro-dark/50">
        {/* Collapsible header */}
        <button
          onClick={toggleCustomSection}
          disabled={disabled}
          className="w-full flex items-center justify-between p-2 text-sm text-gray-300 hover:text-retro-cyan transition-colors disabled:opacity-50 disabled:hover:text-gray-300"
          aria-expanded={customExpanded}
        >
          <span className="font-medium">Bit Settings</span>
          <svg
            className={`w-4 h-4 transition-transform ${customExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible content */}
        {customExpanded && (
          <div className="p-3 pt-1 space-y-3 border-t border-retro-grid/30">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Bit Padding</label>
              <PaddingDirectionSelector value={padding} onChange={onPaddingChange} disabled={disabled} />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Bit Direction</label>
              <BitDirectionSelector value={bitDirection} onChange={onBitDirectionChange} disabled={disabled} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

BinaryFormatSection.displayName = "BinaryFormatSection";
