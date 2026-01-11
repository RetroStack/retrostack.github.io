/**
 * Character Count Preset Selector Component
 *
 * An adaptive preset selector for character set sizes (number of characters).
 * Shows common counts as buttons with overflow in a dropdown.
 * Features:
 * - Common presets: 128, 256, 512, etc.
 * - Priority-based visibility (most common shown first)
 * - Dropdown sections for system-specific and chip-specific presets
 * - Tooltip showing which systems use each count
 *
 * @module components/character-editor/selectors/CharacterCountPresetSelector
 */
"use client";

import { useCallback } from "react";
import {
  CharacterCountPresetWithExamples,
  UNIFIED_CHARACTER_COUNT_PRESETS,
} from "@/lib/character-editor/presets";
import {
  getSystemCharacterCountPresetsByManufacturer,
  getRomChipCharacterCountPresetsByManufacturer,
} from "@/lib/character-editor/data/systems";
import {
  AdaptivePresetSelector,
  PresetDropdownSectionHeader,
  PresetDropdownGroup,
  PresetDropdownButton,
} from "@/components/ui/AdaptivePresetSelector";

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
 */
export function CharacterCountPresetSelector({
  currentCount,
  onSelect,
  presets = UNIFIED_CHARACTER_COUNT_PRESETS,
  disabled = false,
  className = "",
}: CharacterCountPresetSelectorProps) {
  // Get system presets grouped by manufacturer
  const systemPresetsByManufacturer = getSystemCharacterCountPresetsByManufacturer();

  // Get ROM chip presets grouped by manufacturer
  const romChipPresetsByManufacturer = getRomChipCharacterCountPresetsByManufacturer();

  const isSelected = useCallback(
    (preset: CharacterCountPresetWithExamples) => currentCount === preset.count,
    [currentCount]
  );

  const isCurrentCount = useCallback(
    (count: number) => currentCount === count,
    [currentCount]
  );

  const handleSelect = useCallback(
    (preset: CharacterCountPresetWithExamples) => {
      onSelect(preset.count);
    },
    [onSelect]
  );

  const getTooltip = useCallback(
    (preset: CharacterCountPresetWithExamples) => {
      if (preset.description) {
        return preset.examples.length > 0
          ? `${preset.description} - ${preset.examples.join(", ")}`
          : preset.description;
      }
      return preset.examples.length > 0 ? preset.examples.join(", ") : undefined;
    },
    []
  );

  const renderDropdownSections = useCallback(
    (closeDropdown: () => void) => (
      <>
        {/* Systems section */}
        {Object.keys(systemPresetsByManufacturer).length > 0 && (
          <PresetDropdownSectionHeader title="Systems" />
        )}

        {Object.entries(systemPresetsByManufacturer)
          .filter(([, systemPresets]) => systemPresets.length > 0)
          .map(([manufacturer, systemPresets]) => (
            <PresetDropdownGroup key={manufacturer} label={manufacturer}>
              {systemPresets.map((systemPreset) => (
                <PresetDropdownButton
                  key={`${systemPreset.system}-${systemPreset.count}`}
                  label={systemPreset.system}
                  isSelected={isCurrentCount(systemPreset.count)}
                  onClick={() => {
                    onSelect(systemPreset.count);
                    closeDropdown();
                  }}
                  title={`${systemPreset.count} characters`}
                  disabled={disabled}
                />
              ))}
            </PresetDropdownGroup>
          ))}

        {/* ROM ICs section */}
        {Object.keys(romChipPresetsByManufacturer).length > 0 && (
          <PresetDropdownSectionHeader title="Character ROM ICs" showDivider />
        )}

        {Object.entries(romChipPresetsByManufacturer)
          .filter(([, chipPresets]) => chipPresets.length > 0)
          .map(([manufacturer, chipPresets]) => (
            <PresetDropdownGroup key={`rom-${manufacturer}`} label={manufacturer}>
              {chipPresets.map((chipPreset) => (
                <PresetDropdownButton
                  key={`${chipPreset.id}-${chipPreset.count}`}
                  label={chipPreset.partNumber}
                  isSelected={isCurrentCount(chipPreset.count)}
                  onClick={() => {
                    onSelect(chipPreset.count);
                    closeDropdown();
                  }}
                  title={
                    chipPreset.usedIn.length > 0
                      ? `${chipPreset.count} chars - Used in: ${chipPreset.usedIn.join(", ")}`
                      : `${chipPreset.count} characters`
                  }
                  disabled={disabled}
                />
              ))}
            </PresetDropdownGroup>
          ))}
      </>
    ),
    [systemPresetsByManufacturer, romChipPresetsByManufacturer, isCurrentCount, onSelect, disabled]
  );

  return (
    <AdaptivePresetSelector
      presets={presets}
      isSelected={isSelected}
      onSelect={handleSelect}
      getTooltip={getTooltip}
      overflowSectionLabel="Other Counts"
      renderDropdownSections={renderDropdownSections}
      disabled={disabled}
      className={className}
    />
  );
}
