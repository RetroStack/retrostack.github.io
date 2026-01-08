"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { CharacterPreview } from "@/components/character-editor/character/CharacterPreview";
import {
  ImageImportOptions,
  getDefaultImageImportOptions,
  loadImageData,
  parseImageToCharacters,
  detectCharacterDimensions,
  isValidImageFile,
  getSupportedImageExtensions,
} from "@/lib/character-editor/import/imageImport";
import { CharacterSetConfig, Character } from "@/lib/character-editor/types";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { DimensionPresetSelector } from "@/components/character-editor/selectors/DimensionPresetSelector";

export interface ImportFromImageModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when import is complete */
  onImport: (characters: Character[], config: CharacterSetConfig) => void;
}

/**
 * Modal for importing characters from a PNG/image file
 */
export function ImportFromImageModal({
  isOpen,
  onClose,
  onImport,
}: ImportFromImageModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ref: previewContainerRef, size: previewSize } = useResizeObserver<HTMLDivElement>();

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Import options
  const [options, setOptions] = useState<ImageImportOptions>(
    getDefaultImageImportOptions()
  );

  // Dimension suggestions
  const [suggestions, setSuggestions] = useState<
    { width: number; height: number; columns: number; rows: number }[]
  >([]);

  // Parse result
  const parseResult = useMemo(() => {
    if (!imageData) return null;
    return parseImageToCharacters(imageData, options);
  }, [imageData, options]);

  // Calculate responsive preview dimensions
  const previewDimensions = useMemo(() => {
    const containerWidth = previewSize.width || 400;
    const containerHeight = previewSize.height || 500;

    // Calculate the grid dimensions if we have a parse result
    if (!parseResult || parseResult.characters.length === 0) {
      return { scale: 2, maxWidth: containerWidth - 16, maxHeight: containerHeight - 16 };
    }

    const gridWidth = parseResult.columns * options.charWidth;
    const gridHeight = parseResult.rows * options.charHeight;

    // Calculate the maximum scale that fits in the container (with padding)
    const availableWidth = containerWidth - 16;
    const availableHeight = containerHeight - 16;

    const scaleX = availableWidth / gridWidth;
    const scaleY = availableHeight / gridHeight;

    // Use the smaller scale to ensure it fits, clamped between 1 and 4
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
      setFile(null);
      setImageData(null);
      setPreviewUrl(null);
      setError(null);
      setOptions(getDefaultImageImportOptions());
      setSuggestions([]);
    }
  }, [isOpen]);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);

    if (!isValidImageFile(selectedFile)) {
      setError(
        `Invalid file type. Please select an image file (${getSupportedImageExtensions()})`
      );
      return;
    }

    // Limit file size to 10MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      // Create preview URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      // Load image data
      const data = await loadImageData(selectedFile);
      setImageData(data);

      // Get dimension suggestions
      const detected = detectCharacterDimensions(data.width, data.height);
      setSuggestions(detected);

      // Apply first suggestion if available
      if (detected.length > 0) {
        setOptions((prev) => ({
          ...prev,
          charWidth: detected[0].width,
          charHeight: detected[0].height,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load image");
    } finally {
      setLoading(false);
    }
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

    onImport(parseResult.characters, config);
    onClose();
  }, [parseResult, options, onImport, onClose]);

  // Update option handlers
  const updateOption = useCallback(
    <K extends keyof ImageImportOptions>(key: K, value: ImageImportOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
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
            Import from Image
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
          {!imageData ? (
            /* File upload */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
                  ${loading ? "pointer-events-none opacity-50" : ""}
                  border-retro-grid/50 hover:border-retro-cyan/50 bg-retro-navy/30
                `}
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Loading image...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-retro-purple/20 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-retro-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-300 mb-1">
                      Drag and drop an image here
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      or click to browse
                    </p>
                    <p className="text-[10px] text-gray-600">
                      Supports: {getSupportedImageExtensions()}
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Tip:</strong> For best results, use a monochrome image with characters arranged in a grid.</p>
                <p>The importer will auto-detect common character sizes like 8x8, 8x16, etc.</p>
              </div>
            </div>
          ) : (
            /* Configuration and preview */
            <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1">
              {/* Left: Image preview and settings */}
              <div className="space-y-4 lg:w-80 lg:flex-shrink-0">
                {/* Original image preview */}
                <div className="card-retro p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-400">Source Image</span>
                    <button
                      onClick={() => {
                        setFile(null);
                        setImageData(null);
                        setPreviewUrl(null);
                        setSuggestions([]);
                      }}
                      className="text-xs text-retro-cyan hover:text-retro-pink"
                    >
                      Change
                    </button>
                  </div>
                  {previewUrl && (
                    <div className="bg-black/50 rounded p-2 flex justify-center">
                      <img
                        src={previewUrl}
                        alt="Source"
                        className="max-w-full max-h-48 object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {file?.name} - {imageData.width}x{imageData.height} pixels
                  </div>
                </div>

                {/* Settings */}
                <div className="card-retro p-4 space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">Grid Settings</h3>

                  {/* Standard dimension presets */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      Character Size
                    </label>
                    <DimensionPresetSelector
                      currentWidth={options.charWidth}
                      currentHeight={options.charHeight}
                      onSelect={(width, height) => {
                        updateOption("charWidth", width);
                        updateOption("charHeight", height);
                      }}
                    />
                  </div>

                  {/* Dimension suggestions from image */}
                  {suggestions.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">
                        Detected from image
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.slice(0, 4).map((s, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              updateOption("charWidth", s.width);
                              updateOption("charHeight", s.height);
                            }}
                            className={`
                              px-3 py-1 text-xs rounded border transition-colors
                              ${
                                options.charWidth === s.width && options.charHeight === s.height
                                  ? "border-retro-pink bg-retro-pink/10 text-retro-pink"
                                  : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                              }
                            `}
                          >
                            {s.width}x{s.height} ({s.columns * s.rows} chars)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual dimensions */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Char Width
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={32}
                        value={options.charWidth}
                        onChange={(e) => updateOption("charWidth", parseInt(e.target.value) || 8)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Char Height
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={32}
                        value={options.charHeight}
                        onChange={(e) => updateOption("charHeight", parseInt(e.target.value) || 8)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                  </div>

                  {/* Offset */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Offset X
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={imageData.width - 1}
                        value={options.offsetX}
                        onChange={(e) => updateOption("offsetX", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Offset Y
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={imageData.height - 1}
                        value={options.offsetY}
                        onChange={(e) => updateOption("offsetY", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                  </div>

                  {/* Gap between characters */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Gap X
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={32}
                        value={options.gapX}
                        onChange={(e) => updateOption("gapX", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Gap Y
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={32}
                        value={options.gapY}
                        onChange={(e) => updateOption("gapY", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                  </div>

                  {/* Force columns/rows */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Columns (0 = auto)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={256}
                        value={options.forceColumns}
                        onChange={(e) => updateOption("forceColumns", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Rows (0 = auto)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={256}
                        value={options.forceRows}
                        onChange={(e) => updateOption("forceRows", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                      />
                    </div>
                  </div>

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
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                      <span>Dark (0)</span>
                      <span>Light (255)</span>
                    </div>
                  </div>

                  {/* Invert toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="invert"
                      checked={options.invert}
                      onChange={(e) => updateOption("invert", e.target.checked)}
                      className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan"
                    />
                    <label htmlFor="invert" className="text-xs text-gray-400">
                      Invert colors (treat light as foreground)
                    </label>
                  </div>
                </div>
              </div>

              {/* Right: Character preview */}
              <div className="flex flex-col min-h-0 flex-1">
                <div className="card-retro p-3 flex flex-col flex-1 min-h-[300px] lg:min-h-[400px]">
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <span className="text-xs font-medium text-gray-400">
                      Preview ({parseResult?.characters.length || 0} characters)
                    </span>
                    {parseResult && (
                      <span className="text-xs text-gray-500">
                        {parseResult.columns} x {parseResult.rows} grid
                        {previewDimensions.scale > 1 && ` • ${previewDimensions.scale}x`}
                      </span>
                    )}
                  </div>

                  {parseResult && parseResult.characters.length > 0 ? (
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
                      <p className="text-sm">No characters detected</p>
                    </div>
                  )}
                </div>

                {parseResult && parseResult.characters.length > 0 && (
                  <div className="text-xs text-gray-500 space-y-1 mt-4 flex-shrink-0">
                    <p>
                      Characters will be imported at {options.charWidth}x{options.charHeight} pixels.
                    </p>
                    <p>
                      Adjust threshold if characters appear too light or too dark.
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
            disabled={!parseResult || parseResult.characters.length === 0}
          >
            Import {parseResult?.characters.length || 0} Characters
          </Button>
        </div>
      </div>
    </div>
  );
}
