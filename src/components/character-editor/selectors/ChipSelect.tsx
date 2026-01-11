/**
 * Chip Select Component
 *
 * A dropdown selector for ROM chip part numbers. Shows chips
 * grouped by manufacturer with filtering and search.
 * Features:
 * - Editable text input for custom chip names
 * - 3D picker button to open dropdown
 * - Chips grouped by manufacturer (e.g., Intel, Texas Instruments)
 * - Common chips highlighted (8x8, 8x16 patterns)
 * - Clear button to reset selection
 *
 * @module components/character-editor/selectors/ChipSelect
 */
"use client";

import { useMemo, useState, useCallback } from "react";
import { ROM_CHIPS, type RomChipInfo } from "@/lib/character-editor/data/systems";
import { useDropdown } from "@/hooks/useDropdown";
import {
  DropdownPanel,
  DropdownSection,
  DropdownGroup,
  DropdownChipButton,
  DropdownClearButton,
  Picker3DButton,
  pickerInputClasses,
} from "@/components/ui/DropdownPrimitives";

export interface ChipSelectProps {
  /** Currently selected chip (part number) */
  chip: string;
  /** Callback when chip changes */
  onChipChange: (chip: string) => void;
  /** Optional system to filter/highlight compatible chips */
  system?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get chips grouped by manufacturer
 */
function getChipsByManufacturer(): Record<string, RomChipInfo[]> {
  const grouped: Record<string, RomChipInfo[]> = {};
  for (const chip of ROM_CHIPS) {
    if (!grouped[chip.manufacturer]) {
      grouped[chip.manufacturer] = [];
    }
    grouped[chip.manufacturer].push(chip);
  }
  return grouped;
}

/**
 * Display chip as editable input with a picker dropdown
 */
export function ChipSelect({ chip, onChipChange, system, disabled = false, className = "" }: ChipSelectProps) {
  const { ref: dropdownRef, isOpen, toggle, close } = useDropdown<HTMLDivElement>();
  const [searchQuery, setSearchQuery] = useState("");

  // Wrapper for toggle that clears search when opening
  const handleToggle = useCallback(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
    toggle();
  }, [isOpen, toggle]);

  // Get chips grouped by manufacturer, sorted alphabetically
  const chipsByManufacturer = useMemo(() => {
    const grouped = getChipsByManufacturer();
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, []);

  // Get chips compatible with selected system
  const compatibleChipIds = useMemo(() => {
    if (!system) return new Set<string>();
    return new Set(
      ROM_CHIPS.filter((c) => c.usedIn?.some((s) => s.toLowerCase() === system.toLowerCase())).map((c) => c.id)
    );
  }, [system]);

  // Filter chips based on search query
  const filteredChipsByManufacturer = useMemo(() => {
    if (!searchQuery.trim()) {
      return chipsByManufacturer;
    }

    const query = searchQuery.toLowerCase().trim();

    return chipsByManufacturer
      .map(([manufacturer, chips]) => {
        const manufacturerMatches = manufacturer.toLowerCase().includes(query);
        const matchingChips = chips.filter(
          (chipInfo) =>
            manufacturerMatches ||
            chipInfo.partNumber.toLowerCase().includes(query) ||
            chipInfo.id.toLowerCase().includes(query) ||
            chipInfo.type.toLowerCase().includes(query) ||
            chipInfo.usedIn?.some((s) => s.toLowerCase().includes(query))
        );

        if (matchingChips.length === 0) {
          return null;
        }

        return [manufacturer, matchingChips] as [string, RomChipInfo[]];
      })
      .filter((entry): entry is [string, RomChipInfo[]] => entry !== null);
  }, [chipsByManufacturer, searchQuery]);

  // Filter compatible chips based on search query
  const filteredCompatibleChips = useMemo(() => {
    if (!system || compatibleChipIds.size === 0) return [];

    const compatibleChips = ROM_CHIPS.filter((c) => compatibleChipIds.has(c.id));

    if (!searchQuery.trim()) {
      return compatibleChips;
    }

    const query = searchQuery.toLowerCase().trim();
    return compatibleChips.filter(
      (chipInfo) =>
        chipInfo.partNumber.toLowerCase().includes(query) ||
        chipInfo.id.toLowerCase().includes(query) ||
        chipInfo.manufacturer.toLowerCase().includes(query) ||
        chipInfo.type.toLowerCase().includes(query)
    );
  }, [system, compatibleChipIds, searchQuery]);

  const handleChipClick = (partNumber: string, chipManufacturer: string) => {
    onChipChange(`${chipManufacturer} ${partNumber}`);
    close();
    setSearchQuery("");
  };

  const handleClear = () => {
    onChipChange("");
    close();
    setSearchQuery("");
  };

  const isSelected = (partNumber: string, chipManufacturer: string) =>
    chip === `${chipManufacturer} ${partNumber}` || chip === partNumber;

  const hasNoResults = filteredChipsByManufacturer.length === 0 && filteredCompatibleChips.length === 0;

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Chip input */}
      <input
        type="text"
        value={chip}
        onChange={(e) => onChipChange(e.target.value)}
        placeholder="e.g. MOS Technology 901225-01"
        disabled={disabled}
        className={pickerInputClasses}
      />

      {/* Picker dropdown */}
      <div ref={dropdownRef} className="relative flex-shrink-0">
        <Picker3DButton onClick={handleToggle} disabled={disabled} title="Select ROM chip" />

        {/* Dropdown panel */}
        {isOpen && (
          <DropdownPanel width={420} maxHeight={400}>
            {/* Search input - sticky at top */}
            <div className="sticky top-0 z-10 p-2 border-b border-retro-grid/30 bg-retro-navy">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chips by name, manufacturer, or system..."
                autoFocus
                className="w-full px-3 py-1.5 text-sm bg-retro-dark border border-retro-grid/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
              />
            </div>

            {/* Clear option */}
            {chip && !searchQuery && <DropdownClearButton onClick={handleClear} />}

            {hasNoResults ? (
              <div className="text-center text-gray-500 text-sm py-4">No chips found</div>
            ) : (
              <>
                {/* Compatible chips section (if system is selected) */}
                {system && filteredCompatibleChips.length > 0 && (
                  <DropdownSection title={`Compatible with ${system}`}>
                    <div className="flex flex-wrap gap-1">
                      {filteredCompatibleChips.map((chipInfo) => (
                        <DropdownChipButton
                          key={chipInfo.id}
                          label={chipInfo.partNumber}
                          isSelected={isSelected(chipInfo.partNumber, chipInfo.manufacturer)}
                          onClick={() => handleChipClick(chipInfo.partNumber, chipInfo.manufacturer)}
                          title={`${chipInfo.manufacturer} - ${chipInfo.type} - ${chipInfo.glyph.width}x${chipInfo.glyph.height}`}
                        />
                      ))}
                    </div>
                  </DropdownSection>
                )}

                {/* All chips by manufacturer */}
                <div className="p-2">
                  {filteredChipsByManufacturer.map(([manufacturer, chips]) => (
                    <DropdownGroup key={manufacturer} label={manufacturer}>
                      {chips.map((chipInfo) => (
                        <DropdownChipButton
                          key={chipInfo.id}
                          label={chipInfo.partNumber}
                          isSelected={isSelected(chipInfo.partNumber, chipInfo.manufacturer)}
                          onClick={() => handleChipClick(chipInfo.partNumber, chipInfo.manufacturer)}
                          title={`${chipInfo.type} - ${chipInfo.glyph.width}x${chipInfo.glyph.height}${
                            chipInfo.usedIn && chipInfo.usedIn.length > 0 ? ` - Used in: ${chipInfo.usedIn.join(", ")}` : ""
                          }`}
                        />
                      ))}
                    </DropdownGroup>
                  ))}
                </div>
              </>
            )}
          </DropdownPanel>
        )}
      </div>
    </div>
  );
}
