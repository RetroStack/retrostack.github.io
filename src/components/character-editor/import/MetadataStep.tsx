"use client";

import { MetadataFormFields } from "./MetadataFormFields";

export interface MetadataStepProps {
  name: string;
  onNameChange: (name: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  manufacturer: string;
  onManufacturerChange: (manufacturer: string) => void;
  system: string;
  onSystemChange: (system: string) => void;
  chip: string;
  onChipChange: (chip: string) => void;
  locale: string;
  onLocaleChange: (locale: string) => void;
  source: string;
  onSourceChange: (source: string) => void;
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  title?: string;
  subtitle?: string;
  autoFocusName?: boolean;
}

/**
 * Shared metadata form step for import wizards.
 * Used by binary, image, font, and text import flows.
 */
export function MetadataStep({
  title = "Character Set Details",
  subtitle = "Add information about this character set",
  autoFocusName = false,
  ...fieldProps
}: MetadataStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-medium text-gray-200 mb-2">{title}</h2>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>

      <div className="card-retro p-6">
        <MetadataFormFields
          {...fieldProps}
          autoFocusName={autoFocusName}
          idPrefix="metadata-step"
        />
      </div>
    </div>
  );
}
