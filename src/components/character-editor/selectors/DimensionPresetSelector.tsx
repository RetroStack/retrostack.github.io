/**
 * Dimension Preset Selector Component
 *
 * An adaptive preset selector for character dimensions (width x height).
 * Shows common sizes as buttons with overflow in a dropdown.
 * Features:
 * - Common presets: 8x8, 8x16, 8x12, etc.
 * - Priority-based visibility (most common shown first)
 * - Dropdown sections for system-specific and chip-specific presets
 * - Tooltip showing which systems use each dimension
 * - Optional font size in callback for font import
 *
 * @module components/character-editor/selectors/DimensionPresetSelector
 */
"use client";

import { useCallback } from "react";
import {
  DimensionPresetWithExamples,
  UNIFIED_DIMENSION_PRESETS,
} from "@/lib/character-editor/presets";
import {
  getSystemPresetsByManufacturer,
  getRomChipPresetsByManufacturer,
} from "@/lib/character-editor/data/systems";
import {
  AdaptivePresetSelector,
  PresetDropdownSectionHeader,
  PresetDropdownGroup,
  PresetDropdownButton,
} from "@/components/ui/AdaptivePresetSelector";

export interface DimensionPresetSelectorProps {
  /** Current width */
  currentWidth: number;
  /** Current height */
  currentHeight: number;
  /** Callback when a preset is selected */
  onSelect: (width: number, height: number, fontSize?: number) => void;
  /** Which presets to show (defaults to all unified presets) */
  presets?: DimensionPresetWithExamples[];
  /** Whether to include font size in the callback (for font import) */
  includeFontSize?: boolean;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Reusable component for selecting dimension presets
 * Shows presets adaptively based on available space, with overflow in dropdown
 *
 * Used in:
 * - ImportConfigForm (binary ROM import)
 * - ImportFromTextModal (character import from code)
 * - ImportFromFontModal (character import from fonts)
 * - ImportFromImageModal (character import from images)
 */
export function DimensionPresetSelector({
  currentWidth,
  currentHeight,
  onSelect,
  presets = UNIFIED_DIMENSION_PRESETS,
  includeFontSize = false,
  disabled = false,
  className = "",
}: DimensionPresetSelectorProps) {
  // Get system presets grouped by manufacturer
  const systemPresetsByManufacturer = getSystemPresetsByManufacturer();

  // Get ROM chip presets grouped by manufacturer
  const romChipPresetsByManufacturer = getRomChipPresetsByManufacturer();

  const isSelected = useCallback(
    (preset: DimensionPresetWithExamples) =>
      currentWidth === preset.width && currentHeight === preset.height,
    [currentWidth, currentHeight]
  );

  const isCurrentDimension = useCallback(
    (width: number, height: number) =>
      currentWidth === width && currentHeight === height,
    [currentWidth, currentHeight]
  );

  const handleSelect = useCallback(
    (preset: DimensionPresetWithExamples) => {
      if (includeFontSize && preset.recommendedFontSize) {
        onSelect(preset.width, preset.height, preset.recommendedFontSize);
      } else {
        onSelect(preset.width, preset.height);
      }
    },
    [onSelect, includeFontSize]
  );

  const getTooltip = useCallback(
    (preset: DimensionPresetWithExamples) =>
      preset.examples.length > 0 ? preset.examples.join(", ") : undefined,
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
                  key={`${systemPreset.system}-${systemPreset.width}x${systemPreset.height}`}
                  label={systemPreset.system}
                  isSelected={isCurrentDimension(systemPreset.width, systemPreset.height)}
                  onClick={() => {
                    onSelect(systemPreset.width, systemPreset.height);
                    closeDropdown();
                  }}
                  title={`${systemPreset.width}x${systemPreset.height}`}
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
                  key={`${chipPreset.id}-${chipPreset.width}x${chipPreset.height}`}
                  label={chipPreset.partNumber}
                  isSelected={isCurrentDimension(chipPreset.width, chipPreset.height)}
                  onClick={() => {
                    onSelect(chipPreset.width, chipPreset.height);
                    closeDropdown();
                  }}
                  title={
                    chipPreset.usedIn.length > 0
                      ? `${chipPreset.width}x${chipPreset.height} - Used in: ${chipPreset.usedIn.join(", ")}`
                      : `${chipPreset.width}x${chipPreset.height}`
                  }
                  disabled={disabled}
                />
              ))}
            </PresetDropdownGroup>
          ))}
      </>
    ),
    [systemPresetsByManufacturer, romChipPresetsByManufacturer, isCurrentDimension, onSelect, disabled]
  );

  return (
    <AdaptivePresetSelector
      presets={presets}
      isSelected={isSelected}
      onSelect={handleSelect}
      getTooltip={getTooltip}
      overflowSectionLabel="Other Sizes"
      renderDropdownSections={renderDropdownSections}
      disabled={disabled}
      className={className}
    />
  );
}
