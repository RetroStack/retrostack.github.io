"use client";

import { useState, useMemo, useCallback } from "react";
import type { PaddingDirection, BitDirection } from "@/lib/character-editor/types";
import {
  BINARY_EXPORT_SYSTEM_PRESETS,
  type BinaryExportSystemPreset,
  getBinaryExportPresetsByManufacturer,
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
export function BinaryFormatSection({
  padding,
  bitDirection,
  onPaddingChange,
  onBitDirectionChange,
  disabled = false,
  className = "",
}: BinaryFormatSectionProps) {
  const { ref: dropdownRef, isOpen, toggle, close } = useDropdown<HTMLDivElement>();
  const [customExpanded, setCustomExpanded] = useState(false);

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
    onPaddingChange(preset.padding);
    onBitDirectionChange(preset.bitDirection);
    close();
  };

  const handleClear = () => {
    // Reset to default (most common: right padding, MSB first)
    onPaddingChange("right");
    onBitDirectionChange("msb");
    close();
  };

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
            <Picker3DButton onClick={toggle} disabled={disabled} title="Select target system" />

            {/* Dropdown panel */}
            {isOpen && (
              <DropdownPanel width={420} maxHeight={400}>
                {/* Clear option - only show if not already default */}
                {(padding !== "right" || bitDirection !== "msb") && (
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
          <span className="font-medium">Custom Settings</span>
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
