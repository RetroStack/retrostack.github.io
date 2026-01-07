"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { CharacterPreview } from "./CharacterPreview";
import {
  TextImportOptions,
  getDefaultTextImportOptions,
  parseTextToCharacters,
  getParseResultSummary,
} from "@/lib/character-editor/textImport";
import { CharacterSetConfig, Character } from "@/lib/character-editor";
import { useResizeObserver } from "@/hooks/useResizeObserver";

export interface ImportFromTextModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when import is complete */
  onImport: (characters: Character[], config: CharacterSetConfig) => void;
}

/** Preset dimension options */
const DIMENSION_PRESETS = [
  { width: 5, height: 8, label: "5x8" },
  { width: 8, height: 8, label: "8x8" },
  { width: 5, height: 10, label: "5x10" },
  { width: 6, height: 10, label: "6x10" },
  { width: 5, height: 12, label: "5x12" },
  { width: 7, height: 12, label: "7x12" },
  { width: 8, height: 12, label: "8x12" },
  { width: 5, height: 16, label: "5x16" },
  { width: 8, height: 16, label: "8x16" },
  { width: 16, height: 16, label: "16x16" },
  { width: 32, height: 32, label: "32x32" },
];

/**
 * Modal for importing characters from pasted text/code
 */
export function ImportFromTextModal({ isOpen, onClose, onImport }: ImportFromTextModalProps) {
  const { ref: previewContainerRef, size: previewSize } = useResizeObserver<HTMLDivElement>();

  // Text input state
  const [textInput, setTextInput] = useState("");

  // Import options
  const [options, setOptions] = useState<TextImportOptions>(getDefaultTextImportOptions());

  // Parse result (memoized to update on text/options change)
  const parseResult = useMemo(() => {
    if (!textInput.trim()) return null;
    return parseTextToCharacters(textInput, options);
  }, [textInput, options]);

  // Calculate responsive preview dimensions
  const previewDimensions = useMemo(() => {
    const containerWidth = previewSize.width || 400;
    const containerHeight = previewSize.height || 500;

    if (!parseResult || parseResult.characters.length === 0) {
      return { scale: 2, maxWidth: containerWidth - 16, maxHeight: containerHeight - 16 };
    }

    // Estimate grid dimensions (16 columns typical)
    const cols = 16;
    const rows = Math.ceil(parseResult.characters.length / cols);
    const gridWidth = cols * options.charWidth;
    const gridHeight = rows * options.charHeight;

    const availableWidth = containerWidth - 16;
    const availableHeight = containerHeight - 16;

    const scaleX = availableWidth / gridWidth;
    const scaleY = availableHeight / gridHeight;

    const optimalScale = Math.max(1, Math.min(4, Math.floor(Math.min(scaleX, scaleY))));

    return {
      scale: optimalScale,
      maxWidth: availableWidth,
      maxHeight: availableHeight,
    };
  }, [previewSize, parseResult, options.charWidth, options.charHeight]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTextInput("");
      setOptions(getDefaultTextImportOptions());
    }
  }, [isOpen]);

  // Handle import
  const handleImport = useCallback(() => {
    if (!parseResult || parseResult.characters.length === 0) return;

    onImport(parseResult.characters, parseResult.config);
    onClose();
  }, [parseResult, onImport, onClose]);

  // Update option handlers
  const updateOption = useCallback(<K extends keyof TextImportOptions>(key: K, value: TextImportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (!isOpen) return null;

  const hasText = textInput.trim().length > 0;
  const hasCharacters = parseResult && parseResult.characters.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-retro-dark border border-retro-grid/50 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-retro-grid/30">
          <h2 className="text-lg font-display text-gray-200">Import from Code</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
          <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1">
            {/* Left: Text input and settings */}
            <div className="space-y-4 lg:w-80 lg:flex-shrink-0">
              {/* Text input */}
              <div className="card-retro p-4 space-y-3">
                <label className="block text-sm font-medium text-gray-300">Paste Byte Data</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Paste byte values here...

Examples:
  0x00, 0x18, 0x24, 0x42, 0xFF
  { 0x00, 0x18, 0x24, 0x42 }
  $00, $18, $24, $FF
  0, 24, 36, 66, 255`}
                  className="w-full h-40 px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-retro-cyan/50 resize-none"
                />

                {/* Parse status */}
                {hasText && parseResult && (
                  <div className={`text-xs ${parseResult.error ? "text-red-400" : "text-gray-400"}`}>
                    {getParseResultSummary(parseResult)}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="card-retro p-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Character Settings</h3>

                {/* Dimension presets */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Character Size</label>
                  <div className="flex flex-wrap gap-2">
                    {DIMENSION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          updateOption("charWidth", preset.width);
                          updateOption("charHeight", preset.height);
                        }}
                        className={`
                          px-3 py-1.5 text-xs rounded border transition-colors
                          ${
                            options.charWidth === preset.width && options.charHeight === preset.height
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }
                        `}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        // Custom - just deselect presets
                      }}
                      className={`
                        px-3 py-1.5 text-xs rounded border transition-colors
                        ${
                          !DIMENSION_PRESETS.some(
                            (p) => p.width === options.charWidth && p.height === options.charHeight,
                          )
                            ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                            : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                        }
                      `}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Manual dimensions */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width</label>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={options.charWidth}
                      onChange={(e) => updateOption("charWidth", parseInt(e.target.value) || 8)}
                      className="w-full px-3 py-1.5 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Height</label>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={options.charHeight}
                      onChange={(e) => updateOption("charHeight", parseInt(e.target.value) || 8)}
                      className="w-full px-3 py-1.5 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                    />
                  </div>
                </div>

                {/* Padding direction */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Padding Direction</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateOption("padding", "right")}
                      className={`
                        flex-1 px-3 py-1.5 text-xs rounded border transition-colors
                        ${
                          options.padding === "right"
                            ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                            : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                        }
                      `}
                    >
                      Right (most common)
                    </button>
                    <button
                      onClick={() => updateOption("padding", "left")}
                      className={`
                        flex-1 px-3 py-1.5 text-xs rounded border transition-colors
                        ${
                          options.padding === "left"
                            ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                            : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                        }
                      `}
                    >
                      Left
                    </button>
                  </div>
                </div>

                {/* Bit direction */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Bit Direction</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateOption("bitDirection", "ltr")}
                      className={`
                        flex-1 px-3 py-1.5 text-xs rounded border transition-colors
                        ${
                          options.bitDirection === "ltr"
                            ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                            : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                        }
                      `}
                    >
                      MSB First (most common)
                    </button>
                    <button
                      onClick={() => updateOption("bitDirection", "rtl")}
                      className={`
                        flex-1 px-3 py-1.5 text-xs rounded border transition-colors
                        ${
                          options.bitDirection === "rtl"
                            ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                            : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                        }
                      `}
                    >
                      LSB First
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <strong>Supported formats:</strong>
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                  <li>
                    Hex: <code className="text-retro-cyan">0x00</code>, <code className="text-retro-cyan">$FF</code>
                  </li>
                  <li>
                    Decimal: <code className="text-retro-cyan">0</code>, <code className="text-retro-cyan">255</code>
                  </li>
                  <li>
                    Binary: <code className="text-retro-cyan">0b00000000</code>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: Character preview */}
            <div className="flex flex-col min-h-0 flex-1">
              <div className="card-retro p-3 flex flex-col flex-1 min-h-[300px] lg:min-h-[400px]">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-400">
                    Preview ({parseResult?.characters.length || 0} characters)
                  </span>
                  {hasCharacters && (
                    <span className="text-xs text-gray-500">
                      {options.charWidth}x{options.charHeight} pixels each
                      {previewDimensions.scale > 1 && ` • ${previewDimensions.scale}x`}
                    </span>
                  )}
                </div>

                {hasCharacters ? (
                  <div
                    ref={previewContainerRef}
                    className="bg-black/50 rounded p-2 flex-1 overflow-auto flex items-start justify-center"
                  >
                    <CharacterPreview
                      characters={parseResult.characters}
                      config={parseResult.config}
                      maxCharacters={512}
                      maxWidth={previewDimensions.maxWidth}
                      maxHeight={previewDimensions.maxHeight}
                      scale={previewDimensions.scale}
                      showCharacterBorders
                      characterBorderColor="rgba(80, 200, 220, 0.4)"
                    />
                  </div>
                ) : (
                  <div
                    ref={previewContainerRef}
                    className="flex-1 flex flex-col items-center justify-center text-center text-gray-500"
                  >
                    <svg className="w-12 h-12 mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm">
                      {hasText && parseResult?.error ? parseResult.error : "Paste byte data to preview characters"}
                    </p>
                  </div>
                )}
              </div>

              {hasCharacters && (
                <div className="text-xs text-gray-500 space-y-1 mt-4 flex-shrink-0">
                  <p>
                    Characters will be imported at {options.charWidth}x{options.charHeight} pixels.
                  </p>
                  <p>If characters look wrong, try changing the bit direction or padding.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-retro-grid/30">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="cyan" onClick={handleImport} disabled={!hasCharacters}>
            Import {parseResult?.characters.length || 0} Characters
          </Button>
        </div>
      </div>
    </div>
  );
}
