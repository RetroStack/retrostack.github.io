"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { CharacterPreview } from "@/components/character-editor/character/CharacterPreview";
import {
  FontImportOptions,
  getDefaultFontImportOptions,
  isValidFontFile,
  getSupportedFontExtensions,
  getCharacterRangePreview,
  FontParseResult,
  FontParseController,
} from "@/lib/character-editor/import/fontImport";
import { CharacterSetConfig, Character } from "@/lib/character-editor/types";
import { CHARACTER_RANGE_PRESETS } from "@/lib/character-editor/presets";
import { DimensionPresetSelector } from "@/components/character-editor/selectors/DimensionPresetSelector";
import { useResizeObserver } from "@/hooks/useResizeObserver";

export interface ImportFromFontModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when import is complete */
  onImport: (characters: Character[], config: CharacterSetConfig, fontName: string) => void;
}

/**
 * Modal for importing characters from a TTF/OTF/WOFF font file
 */
// Debounce delay for option changes (ms)
const DEBOUNCE_DELAY = 200;

export function ImportFromFontModal({
  isOpen,
  onClose,
  onImport,
}: ImportFromFontModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ref: previewContainerRef, size: previewSize } = useResizeObserver<HTMLDivElement>();

  // Font parse controller for cancellation support
  const parseControllerRef = useRef<FontParseController | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<FontParseResult | null>(null);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);

  // Import options
  const [options, setOptions] = useState<FontImportOptions>(
    getDefaultFontImportOptions()
  );

  // Preview of character range
  const rangePreview = useMemo(
    () => getCharacterRangePreview(options.startCode, options.endCode),
    [options.startCode, options.endCode]
  );

  // Character count
  const characterCount = options.endCode - options.startCode + 1;

  // Calculate responsive preview dimensions
  const previewDimensions = useMemo(() => {
    const containerWidth = previewSize.width || 400;
    const containerHeight = previewSize.height || 500;

    if (!parseResult || parseResult.characters.length === 0) {
      return { scale: 2, maxWidth: containerWidth - 16, maxHeight: containerHeight - 16 };
    }

    // Estimate grid dimensions (16 columns typical for font previews)
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
      // Cancel any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      // Cancel any in-progress parsing
      parseControllerRef.current?.cancel();

      setFile(null);
      setError(null);
      setParseResult(null);
      setProgress(null);
      setOptions(getDefaultFontImportOptions());
    }
  }, [isOpen]);

  // Parse font when file or options change (with debouncing)
  useEffect(() => {
    if (!file) return;

    // Cancel any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel any in-progress parsing
    parseControllerRef.current?.cancel();

    // Debounce the parsing to avoid rapid re-parses when dragging sliders
    debounceTimeoutRef.current = setTimeout(() => {
      const parseFont = async () => {
        // Create a new controller for this parse operation
        const controller = new FontParseController();
        parseControllerRef.current = controller;

        setLoading(true);
        setError(null);
        setProgress(null);

        try {
          const result = await controller.parse(file, options, (processed, total) => {
            // Only update progress if not cancelled
            if (!controller.isCancelled()) {
              setProgress({ processed, total });
            }
          });

          // Only update state if not cancelled
          if (!controller.isCancelled()) {
            setParseResult(result);
            setProgress(null);
            setLoading(false);
          }
        } catch (e) {
          // Ignore if cancelled
          if (controller.isCancelled()) {
            return;
          }

          const message = e instanceof Error ? e.message : "Failed to parse font";

          // Ignore cancellation errors (belt and suspenders)
          if (message === "Cancelled") {
            return;
          }

          // Check if it's a missing dependency error
          if (message.includes("opentype") || message.includes("Cannot find module")) {
            setError(
              "Font import requires the opentype.js library. Please install it with: npm install opentype.js"
            );
          } else {
            setError(message);
          }
          setParseResult(null);
          setProgress(null);
          setLoading(false);
        }
      };

      parseFont();
    }, DEBOUNCE_DELAY);

    return () => {
      // Cleanup: cancel debounce and parsing on unmount or dependency change
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      parseControllerRef.current?.cancel();
    };
  }, [file, options]);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    setParseResult(null);

    if (!isValidFontFile(selectedFile)) {
      setError(
        `Invalid file type. Please select a font file (${getSupportedFontExtensions()})`
      );
      return;
    }

    // Limit file size to 5MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    setFile(selectedFile);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle import
  const handleImport = useCallback(() => {
    if (!parseResult || parseResult.characters.length === 0) return;

    const config: CharacterSetConfig = {
      width: options.charWidth,
      height: options.charHeight,
      padding: "right",
      bitDirection: "ltr",
    };

    onImport(parseResult.characters, config, parseResult.fontFamily);
    onClose();
  }, [parseResult, options, onImport, onClose]);

  // Update option handlers
  const updateOption = useCallback(
    <K extends keyof FontImportOptions>(key: K, value: FontImportOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Apply character range preset
  const applyRangePreset = useCallback(
    (startCode: number, endCode: number) => {
      setOptions((prev) => ({ ...prev, startCode, endCode }));
    },
    []
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-retro-dark border border-retro-grid/50 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-retro-grid/30">
          <h2 className="text-lg font-display text-gray-200">
            Import from Font
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
          {!file ? (
            /* File upload */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleInputChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`
                  flex flex-col items-center justify-center p-12
                  border-2 border-dashed rounded-lg cursor-pointer
                  transition-colors
                  border-retro-grid/50 hover:border-retro-cyan/50 bg-retro-navy/30
                `}
              >
                <div className="w-16 h-16 rounded-full bg-retro-purple/20 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-retro-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300 mb-1">
                  Drag and drop a font file here
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  or click to browse
                </p>
                <p className="text-[10px] text-gray-600">
                  Supports: {getSupportedFontExtensions()}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-400">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Tip:</strong> TrueType (.ttf), OpenType (.otf), and Web Open Font Format (.woff) files are supported.</p>
                <p>The font will be rasterized at the specified size to create bitmap characters.</p>
              </div>
            </div>
          ) : (
            /* Configuration and preview */
            <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1">
              {/* Left: Settings */}
              <div className="space-y-4 lg:w-80 lg:flex-shrink-0">
                {/* Font info */}
                <div className="card-retro p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-400">Font File</span>
                    <button
                      onClick={() => {
                        setFile(null);
                        setParseResult(null);
                      }}
                      className="text-xs text-retro-cyan hover:text-retro-pink"
                    >
                      Change
                    </button>
                  </div>
                  <div className="text-sm text-gray-200 truncate">
                    {file.name}
                  </div>
                  {parseResult && (
                    <div className="text-xs text-gray-500 mt-1">
                      {parseResult.fontFamily}
                    </div>
                  )}
                </div>

                {/* Character dimensions */}
                <div className="card-retro p-4 space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">Character Size</h3>

                  {/* Size presets */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Character Size</label>
                    <DimensionPresetSelector
                      currentWidth={options.charWidth}
                      currentHeight={options.charHeight}
                      onSelect={(width, height, fontSize) => {
                        updateOption("charWidth", width);
                        updateOption("charHeight", height);
                        if (fontSize) {
                          updateOption("fontSize", fontSize);
                        }
                      }}
                      includeFontSize
                    />
                  </div>

                  {/* Manual dimensions */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Width
                      </label>
                      <input
                        type="number"
                        min={4}
                        max={32}
                        value={options.charWidth}
                        onChange={(e) => updateOption("charWidth", parseInt(e.target.value) || 8)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Height
                      </label>
                      <input
                        type="number"
                        min={4}
                        max={32}
                        value={options.charHeight}
                        onChange={(e) => updateOption("charHeight", parseInt(e.target.value) || 8)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Font Size
                      </label>
                      <input
                        type="number"
                        min={4}
                        max={48}
                        value={options.fontSize}
                        onChange={(e) => updateOption("fontSize", parseInt(e.target.value) || 8)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                  </div>
                </div>

                {/* Character range */}
                <div className="card-retro p-4 space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">Character Range</h3>

                  {/* Range presets */}
                  <div className="flex flex-wrap gap-2">
                    {CHARACTER_RANGE_PRESETS.slice(0, 4).map((range) => (
                      <button
                        key={range.name}
                        onClick={() => applyRangePreset(range.startCode, range.endCode)}
                        title={range.description}
                        className={`
                          px-3 py-1 text-xs rounded border transition-colors
                          ${
                            options.startCode === range.startCode && options.endCode === range.endCode
                              ? "border-retro-pink bg-retro-pink/10 text-retro-pink"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }
                        `}
                      >
                        {range.name}
                      </button>
                    ))}
                  </div>

                  {/* Manual range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Start Code
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={65535}
                        value={options.startCode}
                        onChange={(e) => updateOption("startCode", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        End Code
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={65535}
                        value={options.endCode}
                        onChange={(e) => updateOption("endCode", parseInt(e.target.value) || 255)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                  </div>

                  {/* Range preview */}
                  <div className="text-xs text-gray-500">
                    <span className="text-gray-400">{characterCount} characters:</span>{" "}
                    <span className="font-mono">{rangePreview.join("")}</span>
                  </div>
                </div>

                {/* Rendering options */}
                <div className="card-retro p-4 space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">Rendering Options</h3>

                  {/* Threshold slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-500">
                        Threshold
                      </label>
                      <span className="text-xs text-gray-400">{options.threshold}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={options.threshold}
                      onChange={(e) => updateOption("threshold", parseInt(e.target.value))}
                      className="w-full accent-retro-cyan"
                    />
                  </div>

                  {/* Baseline offset */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-500">
                        Baseline Offset
                      </label>
                      <span className="text-xs text-gray-400">{options.baselineOffset}</span>
                    </div>
                    <input
                      type="range"
                      min={-8}
                      max={8}
                      value={options.baselineOffset}
                      onChange={(e) => updateOption("baselineOffset", parseInt(e.target.value))}
                      className="w-full accent-retro-cyan"
                    />
                  </div>

                  {/* Center toggle */}
                  <div className="flex items-center gap-2">
                    <ToggleSwitch
                      id="centerGlyphs"
                      checked={options.centerGlyphs}
                      onChange={(checked) => updateOption("centerGlyphs", checked)}
                    />
                    <label htmlFor="centerGlyphs" className="text-xs text-gray-400 cursor-pointer" onClick={() => updateOption("centerGlyphs", !options.centerGlyphs)}>
                      Center glyphs in cells
                    </label>
                  </div>
                </div>
              </div>

              {/* Right: Character preview */}
              <div className="flex flex-col min-h-0 flex-1">
                <div className="card-retro p-3 flex flex-col flex-1 min-h-[300px] lg:min-h-[400px]">
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <span className="text-xs font-medium text-gray-400">
                      Preview
                    </span>
                    {loading && (
                      <span className="text-xs text-retro-cyan">Processing...</span>
                    )}
                    {parseResult && !loading && (
                      <span className="text-xs text-gray-500">
                        {parseResult.importedCount} glyphs, {parseResult.missingCount} missing
                        {previewDimensions.scale > 1 && ` • ${previewDimensions.scale}x`}
                      </span>
                    )}
                  </div>

                  {error ? (
                    <div className="flex items-start gap-2 text-sm text-red-400 py-8">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-10 h-10 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-sm text-gray-400">
                        {progress
                          ? `Rendering ${progress.processed} of ${progress.total} characters...`
                          : "Preparing font..."}
                      </p>
                      {progress && (
                        <div className="w-48 h-1 bg-retro-navy/50 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-retro-cyan transition-all duration-150"
                            style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ) : parseResult && parseResult.characters.length > 0 ? (
                    <div
                      ref={previewContainerRef}
                      className="bg-black/50 rounded p-2 flex-1 overflow-auto flex items-start justify-center"
                    >
                      <CharacterPreview
                        characters={parseResult.characters}
                        config={{
                          width: options.charWidth,
                          height: options.charHeight,
                          padding: "right",
                          bitDirection: "ltr",
                        }}
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
                      className="flex-1 flex items-center justify-center text-center text-gray-500"
                    >
                      <p className="text-sm">Upload a font to see preview</p>
                    </div>
                  )}
                </div>

                {parseResult && !loading && (
                  <div className="text-xs text-gray-500 space-y-1 mt-4 flex-shrink-0">
                    <p>
                      Characters will be created at {options.charWidth}x{options.charHeight} pixels.
                    </p>
                    <p>
                      Adjust font size and threshold for best results.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-retro-grid/30">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="cyan"
            onClick={handleImport}
            disabled={!parseResult || parseResult.characters.length === 0 || loading}
          >
            Import {parseResult?.characters.length || 0} Characters
          </Button>
        </div>
      </div>
    </div>
  );
}
