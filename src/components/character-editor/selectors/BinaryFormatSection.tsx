"use client";

import { useState, useMemo, useCallback } from "react";
import type { PaddingDirection, BitDirection } from "@/lib/character-editor/types";
import {
  BINARY_EXPORT_SYSTEM_PRESETS,
  type BinaryExportSystemPreset,
  getBinaryExportPresetsByManufacturer,
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
 * Combined binary format section with system preset selector and collapsible custom options.
 *
 * - Primary UI: System preset dropdown to select a target system
 * - Secondary UI: Collapsible "Custom" section for manual padding/bit direction
 * - When a preset is selected, both padding and bit direction are set automatically
 * - When custom values differ from selected preset, shows "Custom" in the input
 *
 * Used in:
 * - ExportView (binary and code export)
 */

/**
 * Find a preset by chip/character generator name.
 * Looks up which systems use this chip and returns the first matching preset.
 */
function findPresetByChipName(chipName: string): BinaryExportSystemPreset | undefined {
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
 * Find a preset by chip name first (higher priority), then by system name
 */
function findInitialPreset(chipName?: string, systemName?: string): BinaryExportSystemPreset | undefined {
  // Chip/character generator takes priority
  if (chipName) {
    const preset = findPresetByChipName(chipName);
    if (preset) return preset;
  }

  // Fall back to system name
  if (systemName) {
    return findPresetBySystemName(systemName);
  }

  return undefined;
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

  // Track the selected preset ID (null means custom or no selection yet)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(() => {
    // Initialize with matching preset - chip takes priority over system
    const preset = findInitialPreset(initialChipName, initialSystemName);
    return preset?.id ?? null;
  });

  // Get presets grouped by manufacturer
  const manufacturerGroups = useMemo(() => getBinaryExportPresetsByManufacturer(), []);

  // Filter manufacturer groups based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return manufacturerGroups;
    }

    const query = searchQuery.toLowerCase().trim();

    return manufacturerGroups
      .map((group) => {
        // Check if manufacturer name matches
        const manufacturerMatches = group.manufacturer.toLowerCase().includes(query);

        // Filter systems that match the query
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
  }, [manufacturerGroups, searchQuery]);

  // Find the selected preset by ID, or check if current values match it
  // When padding/bitDirection change externally, currentPreset will be null (shows "Custom")
  const currentPreset = useMemo(() => {
    if (selectedPresetId) {
      const preset = BINARY_EXPORT_SYSTEM_PRESETS.find((p) => p.id === selectedPresetId);
      // Only return the preset if the current values still match
      if (preset && preset.padding === padding && preset.bitDirection === bitDirection) {
        return preset;
      }
    }
    // No valid selection - return null (will show "Custom")
    return null;
  }, [selectedPresetId, padding, bitDirection]);

  // Display text for the input
  const displayText = currentPreset
    ? `${currentPreset.manufacturer} ${currentPreset.name}`
    : "Custom";

  // Close dropdown and clear search
  const closeDropdown = useCallback(() => {
    close();
    setSearchQuery("");
  }, [close]);

  const handlePresetClick = useCallback(
    (preset: BinaryExportSystemPreset) => {
      setSelectedPresetId(preset.id);
      onPaddingChange(preset.padding);
      onBitDirectionChange(preset.bitDirection);
      closeDropdown();
    },
    [onPaddingChange, onBitDirectionChange, closeDropdown]
  );

  const handleClear = useCallback(() => {
    // Reset to default (most common: right padding, MSB first)
    setSelectedPresetId(null);
    onPaddingChange("right");
    onBitDirectionChange("msb");
    closeDropdown();
  }, [onPaddingChange, onBitDirectionChange, closeDropdown]);

  const toggleCustomSection = useCallback(() => {
    setCustomExpanded((prev) => !prev);
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* System preset selector */}
      <div>
        <h3 className="text-xs font-medium text-gray-400 mb-2">Target System</h3>
        <div className="flex gap-2">
          {/* Read-only display input */}
          <input
            type="text"
            value={displayText}
            readOnly
            disabled={disabled}
            className={pickerInputClasses}
            title="Select a target system from the picker"
          />

          {/* Picker dropdown */}
          <div ref={dropdownRef} className="relative flex-shrink-0">
            <Picker3DButton onClick={handleToggle} disabled={disabled} title="Select target system" />

            {/* Dropdown panel */}
            {isOpen && (
              <DropdownPanel width={420} maxHeight={400}>
                {/* Search input */}
                <div className="p-2 border-b border-retro-grid/30">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search systems..."
                    autoFocus
                    className="w-full px-3 py-1.5 text-sm bg-retro-dark border border-retro-grid/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
                  />
                </div>

                {/* Clear option - only show if not already default */}
                {(padding !== "right" || bitDirection !== "msb") && !searchQuery && (
                  <DropdownClearButton onClick={handleClear} label="Reset to default" />
                )}

                {/* Systems grouped by manufacturer */}
                <div className="p-2">
                  {filteredGroups.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No systems found
                    </div>
                  ) : (
                    filteredGroups.map((group) => (
                      <DropdownGroup key={group.manufacturer} label={group.manufacturer}>
                        {group.systems.map((preset) => (
                          <DropdownChipButton
                            key={preset.id}
                            label={preset.name}
                            isSelected={currentPreset?.id === preset.id}
                            onClick={() => handlePresetClick(preset)}
                          />
                        ))}
                      </DropdownGroup>
                    ))
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
              <PaddingDirectionSelector
                value={padding}
                onChange={onPaddingChange}
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Bit Direction</label>
              <BitDirectionSelector
                value={bitDirection}
                onChange={onBitDirectionChange}
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

BinaryFormatSection.displayName = "BinaryFormatSection";
