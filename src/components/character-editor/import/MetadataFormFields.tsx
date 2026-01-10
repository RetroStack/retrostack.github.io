"use client";

import { useCallback } from "react";
import { ManufacturerSystemSelect } from "../selectors/ManufacturerSystemSelect";
import { ChipSelect } from "../selectors/ChipSelect";
import { getRomChipsForSystem } from "@/lib/character-editor/data/manufacturers";
import { TagInput } from "@/components/ui/TagInput";

export interface MetadataFormFieldsProps {
  /** Name field value */
  name: string;
  /** Callback when name changes */
  onNameChange: (name: string) => void;
  /** Description field value */
  description: string;
  /** Callback when description changes */
  onDescriptionChange: (description: string) => void;
  /** Manufacturer field value */
  manufacturer: string;
  /** Callback when manufacturer changes */
  onManufacturerChange: (manufacturer: string) => void;
  /** System field value */
  system: string;
  /** Callback when system changes */
  onSystemChange: (system: string) => void;
  /** Chip field value */
  chip: string;
  /** Callback when chip changes */
  onChipChange: (chip: string) => void;
  /** Locale field value */
  locale: string;
  /** Callback when locale changes */
  onLocaleChange: (locale: string) => void;
  /** Source field value */
  source: string;
  /** Callback when source changes */
  onSourceChange: (source: string) => void;
  /** Tags field value */
  tags?: string[];
  /** Callback when tags change */
  onTagsChange?: (tags: string[]) => void;
  /** Whether to auto-focus the name field */
  autoFocusName?: boolean;
  /** Use compact spacing (space-y-4 instead of space-y-6) */
  compact?: boolean;
  /** Prefix for input IDs (for accessibility) */
  idPrefix?: string;
}

/**
 * Shared form fields for character set metadata.
 * Used by MetadataStep (import wizard) and MetadataEditModal.
 *
 * Includes auto-fill logic: when a system is selected, automatically
 * fills in the first known ROM chip for that system if chip is empty.
 */
export function MetadataFormFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  manufacturer,
  onManufacturerChange,
  system,
  onSystemChange,
  chip,
  onChipChange,
  locale,
  onLocaleChange,
  source,
  onSourceChange,
  tags = [],
  onTagsChange,
  autoFocusName = false,
  compact = false,
  idPrefix = "metadata",
}: MetadataFormFieldsProps) {
  // Handle system change - auto-fill chip if empty and system has known chips
  const handleSystemChange = useCallback(
    (newSystem: string) => {
      onSystemChange(newSystem);

      // Auto-fill chip if empty and system has known chips
      if (!chip && newSystem) {
        const systemChips = getRomChipsForSystem(newSystem);
        if (systemChips.length > 0) {
          const firstChip = systemChips[0];
          onChipChange(`${firstChip.manufacturer} ${firstChip.partNumber}`);
        }
      }
    },
    [chip, onSystemChange, onChipChange]
  );

  const spacingClass = compact ? "space-y-4" : "space-y-6";

  return (
    <div className={spacingClass}>
      {/* Name */}
      <div>
        <label
          htmlFor={`${idPrefix}-name`}
          className="block text-sm text-gray-300 mb-1"
        >
          Name <span className="text-retro-pink">*</span>
        </label>
        <input
          type="text"
          id={`${idPrefix}-name`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="My Character Set"
          className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
          autoFocus={autoFocusName}
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor={`${idPrefix}-description`}
          className="block text-sm text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Optional description..."
          rows={2}
          className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan resize-none"
        />
      </div>

      {/* Manufacturer and System */}
      <div>
        {compact && (
          <label className="block text-sm text-gray-300 mb-1">
            Manufacturer & System
          </label>
        )}
        <ManufacturerSystemSelect
          manufacturer={manufacturer}
          system={system}
          onManufacturerChange={onManufacturerChange}
          onSystemChange={handleSystemChange}
        />
      </div>

      {/* Chip */}
      <div>
        <label
          htmlFor={`${idPrefix}-chip`}
          className="block text-sm text-gray-300 mb-1"
        >
          ROM Chip
        </label>
        <ChipSelect chip={chip} onChipChange={onChipChange} system={system} />
      </div>

      {/* Locale */}
      <div>
        <label
          htmlFor={`${idPrefix}-locale`}
          className="block text-sm text-gray-300 mb-1"
        >
          Locale
        </label>
        <input
          type="text"
          id={`${idPrefix}-locale`}
          value={locale}
          onChange={(e) => onLocaleChange(e.target.value)}
          placeholder="e.g., English, German, Japanese"
          className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
        />
      </div>

      {/* Source */}
      <div>
        <label
          htmlFor={`${idPrefix}-source`}
          className="block text-sm text-gray-300 mb-1"
        >
          {compact ? "Source / Attribution" : "Source"}
        </label>
        <input
          type="text"
          id={`${idPrefix}-source`}
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          placeholder={compact ? "yourself" : "Where did this ROM come from?"}
          className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
        />
      </div>

      {/* Tags */}
      {onTagsChange && (
        <div>
          <label
            htmlFor={`${idPrefix}-tags-input`}
            className="block text-sm text-gray-300 mb-1"
          >
            Tags
          </label>
          <TagInput
            tags={tags}
            onTagsChange={onTagsChange}
            placeholder="Add tags (comma to add)"
            idPrefix={`${idPrefix}-tags`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Press comma or Enter to add a tag
          </p>
        </div>
      )}
    </div>
  );
}
