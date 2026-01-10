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

import { useMemo } from "react";
import { ROM_CHIPS, RomChipInfo } from "@/lib/character-editor/data/manufacturers";
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
  const dropdown = useDropdown<HTMLDivElement>();

  // Get chips grouped by manufacturer, sorted alphabetically
  const chipsByManufacturer = useMemo(() => {
    const grouped = getChipsByManufacturer();
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, []);

  // Get chips compatible with selected system
  const compatibleChipIds = useMemo(() => {
    if (!system) return new Set<string>();
    return new Set(
      ROM_CHIPS.filter((c) => c.usedIn.some((s) => s.toLowerCase() === system.toLowerCase())).map((c) => c.id)
    );
  }, [system]);

  const handleChipClick = (partNumber: string, chipManufacturer: string) => {
    onChipChange(`${chipManufacturer} ${partNumber}`);
    dropdown.close();
  };

  const handleClear = () => {
    onChipChange("");
    dropdown.close();
  };

  const isSelected = (partNumber: string, chipManufacturer: string) =>
    chip === `${chipManufacturer} ${partNumber}` || chip === partNumber;

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
      <div ref={dropdown.ref} className="relative flex-shrink-0">
        <Picker3DButton onClick={dropdown.toggle} disabled={disabled} title="Select ROM chip" />

        {/* Dropdown panel */}
        {dropdown.isOpen && (
          <DropdownPanel>
            {/* Clear option */}
            {chip && <DropdownClearButton onClick={handleClear} />}

            {/* Compatible chips section (if system is selected) */}
            {system && compatibleChipIds.size > 0 && (
              <DropdownSection title={`Compatible with ${system}`}>
                <div className="flex flex-wrap gap-1">
                  {ROM_CHIPS.filter((c) => compatibleChipIds.has(c.id)).map((chipInfo) => (
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
              {chipsByManufacturer.map(([manufacturer, chips]) => (
                <DropdownGroup key={manufacturer} label={manufacturer}>
                  {chips.map((chipInfo) => (
                    <DropdownChipButton
                      key={chipInfo.id}
                      label={chipInfo.partNumber}
                      isSelected={isSelected(chipInfo.partNumber, chipInfo.manufacturer)}
                      onClick={() => handleChipClick(chipInfo.partNumber, chipInfo.manufacturer)}
                      title={`${chipInfo.type} - ${chipInfo.glyph.width}x${chipInfo.glyph.height}${
                        chipInfo.usedIn.length > 0 ? ` - Used in: ${chipInfo.usedIn.join(", ")}` : ""
                      }`}
                    />
                  ))}
                </DropdownGroup>
              ))}
            </div>
          </DropdownPanel>
        )}
      </div>
    </div>
  );
}
