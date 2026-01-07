"use client";

import { ManufacturerSystemSelect } from "./ManufacturerSystemSelect";

export interface MetadataStepProps {
  name: string;
  onNameChange: (name: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  manufacturer: string;
  onManufacturerChange: (manufacturer: string) => void;
  system: string;
  onSystemChange: (system: string) => void;
  locale: string;
  onLocaleChange: (locale: string) => void;
  source: string;
  onSourceChange: (source: string) => void;
  title?: string;
  subtitle?: string;
}

/**
 * Shared metadata form step for import wizards.
 * Used by binary, image, font, and text import flows.
 */
export function MetadataStep({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  manufacturer,
  onManufacturerChange,
  system,
  onSystemChange,
  locale,
  onLocaleChange,
  source,
  onSourceChange,
  title = "Character Set Details",
  subtitle = "Add information about this character set",
}: MetadataStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-medium text-gray-200 mb-2">{title}</h2>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>

      <div className="card-retro p-6 space-y-6">
        {/* Name */}
        <div>
          <label
            htmlFor="metadata-name"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Name <span className="text-retro-pink">*</span>
          </label>
          <input
            type="text"
            id="metadata-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="My Character Set"
            className="w-full px-4 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="metadata-description"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Description
          </label>
          <textarea
            id="metadata-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Optional description..."
            rows={2}
            className="w-full px-4 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50 resize-none"
          />
        </div>

        {/* Manufacturer and System */}
        <ManufacturerSystemSelect
          manufacturer={manufacturer}
          system={system}
          onManufacturerChange={onManufacturerChange}
          onSystemChange={onSystemChange}
        />

        {/* Locale */}
        <div>
          <label
            htmlFor="metadata-locale"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Locale
          </label>
          <input
            type="text"
            id="metadata-locale"
            value={locale}
            onChange={(e) => onLocaleChange(e.target.value)}
            placeholder="e.g., English, German, Japanese"
            className="w-full px-4 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50"
          />
        </div>

        {/* Source */}
        <div>
          <label
            htmlFor="metadata-source"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Source
          </label>
          <input
            type="text"
            id="metadata-source"
            value={source}
            onChange={(e) => onSourceChange(e.target.value)}
            placeholder="Where did this ROM come from?"
            className="w-full px-4 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50"
          />
        </div>
      </div>
    </div>
  );
}
