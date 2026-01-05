"use client";

import { useMemo, useCallback } from "react";
import { CharacterPreview } from "./CharacterPreview";
import { SizePresetDropdown } from "./SizePresetDropdown";
import {
  CharacterSetConfig,
  Character,
  PaddingDirection,
  BitDirection,
  calculateCharacterCount,
  formatFileSize,
} from "@/lib/character-editor";

export interface ImportWizardStep3Props {
  /** File data buffer */
  fileData: ArrayBuffer | null;
  /** Current configuration */
  config: CharacterSetConfig;
  /** Parsed characters with current config */
  characters: Character[];
  /** Callback when configuration changes */
  onConfigChange: (config: CharacterSetConfig) => void;
}

/**
 * Step 3: Interpretation settings with live preview
 */
export function ImportWizardStep3({
  fileData,
  config,
  characters,
  onConfigChange,
}: ImportWizardStep3Props) {
  // Calculate character count and bytes per char
  const characterInfo = useMemo(() => {
    const fileSize = fileData?.byteLength || 0;
    const bytesPerLine = Math.ceil(config.width / 8);
    const bytesPerChar = bytesPerLine * config.height;
    const charCount = fileSize ? calculateCharacterCount(fileSize, config) : 0;
    return { fileSize, bytesPerChar, charCount };
  }, [fileData, config]);

  // Handlers
  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 16) {
        onConfigChange({ ...config, width: value });
      }
    },
    [config, onConfigChange]
  );

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 16) {
        onConfigChange({ ...config, height: value });
      }
    },
    [config, onConfigChange]
  );

  const handlePresetClick = useCallback(
    (width: number, height: number) => {
      onConfigChange({ ...config, width, height });
    },
    [config, onConfigChange]
  );

  const handlePaddingChange = useCallback(
    (padding: PaddingDirection) => {
      onConfigChange({ ...config, padding });
    },
    [config, onConfigChange]
  );

  const handleBitDirectionChange = useCallback(
    (bitDirection: BitDirection) => {
      onConfigChange({ ...config, bitDirection });
    },
    [config, onConfigChange]
  );

  const buttonClasses = (active: boolean) => `
    flex-1 px-3 py-2 text-sm rounded border transition-colors
    ${
      active
        ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
        : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
    }
  `;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-medium text-white mb-2">
          Configure Interpretation
        </h2>
        <p className="text-sm text-gray-400">
          Adjust settings until the preview looks correct
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Settings */}
        <div className="space-y-5">
          {/* Dimension presets */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Dimension Presets
            </h3>
            <SizePresetDropdown
              currentWidth={config.width}
              currentHeight={config.height}
              onSelect={handlePresetClick}
            />
          </div>

          {/* Custom dimensions */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Custom Dimensions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={config.width}
                  onChange={handleWidthChange}
                  className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={config.height}
                  onChange={handleHeightChange}
                  className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                />
              </div>
            </div>
            {characterInfo.fileSize > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {characterInfo.bytesPerChar} bytes/char ={" "}
                {characterInfo.charCount} characters (
                {formatFileSize(characterInfo.fileSize)})
              </p>
            )}
          </div>

          {/* Bit padding */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Bit Padding
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePaddingChange("right")}
                className={buttonClasses(config.padding === "right")}
              >
                Right (default)
              </button>
              <button
                type="button"
                onClick={() => handlePaddingChange("left")}
                className={buttonClasses(config.padding === "left")}
              >
                Left
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Which side unused bits are padded in each byte
            </p>
          </div>

          {/* Bit direction */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Bit Direction
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleBitDirectionChange("ltr")}
                className={buttonClasses(config.bitDirection === "ltr")}
              >
                Left to Right
              </button>
              <button
                type="button"
                onClick={() => handleBitDirectionChange("rtl")}
                className={buttonClasses(config.bitDirection === "rtl")}
              >
                Right to Left
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Order bits are read within each byte (MSB vs LSB first)
            </p>
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-300">Preview</h3>
            <span className="text-xs text-gray-500">
              {characters.length} character{characters.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="bg-black/50 rounded-lg p-4 min-h-[280px] max-h-[400px] overflow-auto">
            {characters.length > 0 ? (
              <CharacterPreview
                characters={characters}
                config={config}
                maxCharacters={512}
                forceColumns={32}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <svg
                  className="w-10 h-10 text-gray-600 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-gray-400">
                  No characters detected
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Try adjusting the dimensions
                </p>
              </div>
            )}
          </div>

          {characters.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              If the preview looks scrambled, try different dimensions, padding,
              or bit direction settings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
