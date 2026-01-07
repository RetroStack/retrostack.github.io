"use client";

import { useMemo } from "react";
import { CharacterSetConfig } from "@/lib/character-editor/types";
import { calculateCharacterCount, formatFileSize } from "@/lib/character-editor/utils";
import { DimensionPresetSelector } from "./DimensionPresetSelector";
import { PaddingDirectionSelector } from "./PaddingDirectionSelector";
import { BitDirectionSelector } from "./BitDirectionSelector";

export interface ImportConfigFormProps {
  /** Current configuration */
  config: CharacterSetConfig;
  /** Callback when configuration changes */
  onConfigChange: (config: CharacterSetConfig) => void;
  /** File size for character count calculation */
  fileSize?: number;
  /** Character set name */
  name: string;
  /** Callback when name changes */
  onNameChange: (name: string) => void;
  /** Character set description */
  description: string;
  /** Callback when description changes */
  onDescriptionChange: (description: string) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
}

/**
 * Configuration form for importing binary ROM files
 */
export function ImportConfigForm({
  config,
  onConfigChange,
  fileSize,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  disabled = false,
}: ImportConfigFormProps) {
  // Calculate character count based on file size and config
  const characterCount = useMemo(() => {
    if (!fileSize) return 0;
    return calculateCharacterCount(fileSize, config);
  }, [fileSize, config]);

  const bytesPerChar = useMemo(() => {
    const bytesPerLine = Math.ceil(config.width / 8);
    return bytesPerLine * config.height;
  }, [config.width, config.height]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 16) {
      onConfigChange({ ...config, width: value });
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 16) {
      onConfigChange({ ...config, height: value });
    }
  };


  return (
    <div className="space-y-6">
      {/* Name and description */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="My Character Set"
            disabled={disabled}
            className="w-full px-4 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50 disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Optional description..."
            rows={2}
            disabled={disabled}
            className="w-full px-4 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50 resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Character Dimensions
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="width"
              className="block text-xs text-gray-500 mb-1"
            >
              Width (pixels)
            </label>
            <input
              type="number"
              id="width"
              min={1}
              max={16}
              value={config.width}
              onChange={handleWidthChange}
              disabled={disabled}
              className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50 disabled:opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="height"
              className="block text-xs text-gray-500 mb-1"
            >
              Height (pixels)
            </label>
            <input
              type="number"
              id="height"
              min={1}
              max={16}
              value={config.height}
              onChange={handleHeightChange}
              disabled={disabled}
              className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Calculated info */}
        {fileSize && (
          <div className="mt-2 text-xs text-gray-500">
            {bytesPerChar} bytes/char = {characterCount} character
            {characterCount !== 1 ? "s" : ""} ({formatFileSize(fileSize)} file)
          </div>
        )}
      </div>

      {/* Padding direction */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Bit Padding
        </h3>
        <PaddingDirectionSelector
          value={config.padding}
          onChange={(padding) => onConfigChange({ ...config, padding })}
          disabled={disabled}
        />
        <p className="mt-2 text-xs text-gray-500">
          Determines which side unused bits are padded in each byte
        </p>
      </div>

      {/* Bit direction */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Bit Direction
        </h3>
        <BitDirectionSelector
          value={config.bitDirection}
          onChange={(bitDirection) => onConfigChange({ ...config, bitDirection })}
          disabled={disabled}
        />
        <p className="mt-2 text-xs text-gray-500">
          The order bits are read within each byte (MSB vs LSB first)
        </p>
      </div>

      {/* Common presets */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Quick Presets
        </h3>
        <DimensionPresetSelector
          currentWidth={config.width}
          currentHeight={config.height}
          onSelect={(width, height) =>
            onConfigChange({ ...config, width, height })
          }
          disabled={disabled}
        />
      </div>
    </div>
  );
}
