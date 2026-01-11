"use client";

import { useMemo } from "react";
import { useDropdown } from "@/hooks/useDropdown";
import {
  DropdownPanel,
  DropdownGroup,
  DropdownChipButton,
  DropdownClearButton,
  Picker3DButton,
  pickerInputClasses,
} from "@/components/ui/DropdownPrimitives";
import type { PaddingDirection, BitDirection } from "@/lib/character-editor/types";
import {
  BINARY_EXPORT_SYSTEM_PRESETS,
  BinaryExportSystemPreset,
  getBinaryExportPresetsByManufacturer,
} from "@/lib/character-editor/presets";

export interface BinarySystemSelectorProps {
  /** Current padding direction */
  padding: PaddingDirection;
  /** Current bit direction */
  bitDirection: BitDirection;
  /** Callback when system preset is selected */
  onSystemChange: (padding: PaddingDirection, bitDirection: BitDirection) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Dropdown selector for choosing a target system for binary export
 * Automatically sets the padding and bit direction based on the selected system
 *
 * Uses the same picker dropdown style as ManufacturerSystemSelect,
 * with systems grouped by manufacturer.
 *
 * Used in:
 * - ExportView (binary export)
 */
export function BinarySystemSelector({
  padding,
  bitDirection,
  onSystemChange,
  disabled = false,
  className = "",
}: BinarySystemSelectorProps) {
  const { ref: dropdownRef, isOpen, toggle, close } = useDropdown<HTMLDivElement>();

  // Get presets grouped by manufacturer
  const manufacturerGroups = useMemo(() => getBinaryExportPresetsByManufacturer(), []);

  // Find the current matching system
  const currentPreset = useMemo(() => {
    return BINARY_EXPORT_SYSTEM_PRESETS.find(
      (p) => p.padding === padding && p.bitDirection === bitDirection
    );
  }, [padding, bitDirection]);

  // Display text for the input
  const displayText = currentPreset
    ? `${currentPreset.manufacturer} ${currentPreset.name}`
    : "Custom";

  const handlePresetClick = (preset: BinaryExportSystemPreset) => {
    onSystemChange(preset.padding, preset.bitDirection);
    close();
  };

  const handleClear = () => {
    // Reset to default (most common: right padding, MSB first)
    onSystemChange("right", "ltr");
    close();
  };

  return (
    <div className={`flex gap-2 ${className}`}>
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
        <Picker3DButton onClick={toggle} disabled={disabled} title="Select target system" />

        {/* Dropdown panel */}
        {isOpen && (
          <DropdownPanel width={420} maxHeight={400}>
            {/* Clear option - only show if not already default */}
            {(padding !== "right" || bitDirection !== "ltr") && (
              <DropdownClearButton onClick={handleClear} label="Reset to default" />
            )}

            {/* Systems grouped by manufacturer */}
            <div className="p-2">
              {manufacturerGroups.map((group) => (
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
              ))}
            </div>
          </DropdownPanel>
        )}
      </div>
    </div>
  );
}
