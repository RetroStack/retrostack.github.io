"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { NeonText } from "@/components/effects/NeonText";
import { CharacterPreview } from "@/components/character-editor/character/CharacterPreview";
import { ImportStepIndicator } from "@/components/character-editor/import/ImportStepIndicator";
import { MetadataStep } from "@/components/character-editor/import/MetadataStep";
import { DimensionPresetSelector } from "@/components/character-editor/selectors/DimensionPresetSelector";
import { useCharacterLibrary } from "@/hooks/character-editor/useCharacterLibrary";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import {
  ImageImportOptions,
  getDefaultImageImportOptions,
  loadImageData,
  parseImageToCharacters,
  rotateImageData,
  isValidImageFile,
  getSupportedImageExtensions,
  ReadingOrder,
} from "@/lib/character-editor/import/imageImport";
import { CharacterSetConfig, Character, generateId } from "@/lib/character-editor/types";

type WizardStep = 1 | 2 | 3;

const STEP_LABELS = ["Configure", "Metadata", "Save"];

// Picker wizard types for clicking on the source image
type PickerMode = "offset" | "pixelSize" | "gap" | "gridLineOffset" | null;

interface PickerPoint {
  x: number;
  y: number;
}

interface PickerState {
  mode: PickerMode;
  step: number; // 0 = not started, 1 = first point, 2 = second point, etc.
  points: PickerPoint[];
}

/**
 * Image import view - Extract characters from PNG/image files
 */
export function ImageImportView() {
  const router = useRouter();
  const { save } = useCharacterLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ref: previewContainerRef, size: previewSize } = useResizeObserver<HTMLDivElement>();

  // Current step
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1: File state
  const [file, setFile] = useState<File | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Import options
  const [options, setOptions] = useState<ImageImportOptions>(getDefaultImageImportOptions());

  // Step 2: Metadata state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [system, setSystem] = useState("");
  const [chip, setChip] = useState("");
  const [locale, setLocale] = useState("");
  const [source, setSource] = useState("");

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Picker wizard state for clicking on source image
  const [picker, setPicker] = useState<PickerState>({ mode: null, step: 0, points: [] });

  // Grid line offset for alignment visualization (independent of character extraction offset)
  const [gridLineOffsetX, setGridLineOffsetX] = useState(0);
  const [gridLineOffsetY, setGridLineOffsetY] = useState(0);

  // Start a picker wizard
  const startPicker = useCallback((mode: PickerMode) => {
    setPicker({ mode, step: 1, points: [] });
  }, []);

  // Cancel picker wizard
  const cancelPicker = useCallback(() => {
    setPicker({ mode: null, step: 0, points: [] });
  }, []);

  // Parse result
  const parseResult = useMemo(() => {
    if (!imageData) return null;
    return parseImageToCharacters(imageData, options);
  }, [imageData, options]);

  // Helper function to map grid position (row, col) to character index based on reading order
  const getCharIndexForGridPosition = useCallback(
    (row: number, col: number, rows: number, columns: number): number => {
      const readingOrder = options.readingOrder;
      const isRowMajor = readingOrder.startsWith("ltr") || readingOrder.startsWith("rtl");
      const isLeftToRight = readingOrder.includes("ltr");
      const isTopToBottom = readingOrder.includes("ttb");

      // Map to the index in reading order
      const effectiveRow = isTopToBottom ? row : rows - 1 - row;
      const effectiveCol = isLeftToRight ? col : columns - 1 - col;

      if (isRowMajor) {
        return effectiveRow * columns + effectiveCol;
      } else {
        return effectiveCol * rows + effectiveRow;
      }
    },
    [options.readingOrder],
  );

  // Rotated preview image for display
  const rotatedPreview = useMemo(() => {
    if (!imageData || options.rotation === 0) {
      return { imageData, url: previewUrl };
    }

    const rotated = rotateImageData(imageData, options.rotation);
    // Create a data URL from the rotated ImageData
    const canvas = document.createElement("canvas");
    canvas.width = rotated.width;
    canvas.height = rotated.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { imageData, url: previewUrl };
    }
    ctx.putImageData(rotated, 0, 0);
    const url = canvas.toDataURL();

    return { imageData: rotated, url };
  }, [imageData, options.rotation, previewUrl]);

  // Characters from parse result
  const characters: Character[] = parseResult?.characters || [];

  // Config derived from options
  const config: CharacterSetConfig = useMemo(
    () => ({
      width: options.charWidth,
      height: options.charHeight,
      padding: "right",
      bitDirection: "ltr",
    }),
    [options.charWidth, options.charHeight],
  );

  // Calculate responsive preview dimensions
  const previewDimensions = useMemo(() => {
    const containerWidth = previewSize.width || 400;
    const containerHeight = previewSize.height || 500;

    if (!parseResult || parseResult.characters.length === 0) {
      return { scale: 2, maxWidth: containerWidth - 16, maxHeight: containerHeight - 16 };
    }

    const gridWidth = parseResult.columns * options.charWidth;
    const gridHeight = parseResult.rows * options.charHeight;

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

  // Step validation
  const canProceedStep1 = imageData && parseResult && parseResult.characters.length > 0;
  const canProceedStep2 = name.trim().length > 0;
  const canSave = canProceedStep1 && canProceedStep2;

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);

    if (!isValidImageFile(selectedFile)) {
      setError(`Invalid file type. Please select an image file (${getSupportedImageExtensions()})`);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      const data = await loadImageData(selectedFile);
      setImageData(data);

      // Set default name from filename
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setName(baseName);
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
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  // Update option handlers
  const updateOption = useCallback(<K extends keyof ImageImportOptions>(key: K, value: ImageImportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Handle click on source image for picker
  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!picker.mode || !imageData) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const scrollLeft = e.currentTarget.scrollLeft;
      const scrollTop = e.currentTarget.scrollTop;
      const x = Math.round(e.clientX - rect.left + scrollLeft);
      const y = Math.round(e.clientY - rect.top + scrollTop);

      const newPoints = [...picker.points, { x, y }];

      if (picker.mode === "offset") {
        // Single click sets offset
        setOptions((prev) => ({ ...prev, offsetX: x, offsetY: y }));
        setPicker({ mode: null, step: 0, points: [] });
      } else if (picker.mode === "pixelSize") {
        if (picker.step === 1) {
          // First click - top-left of pixel
          setPicker({ mode: "pixelSize", step: 2, points: newPoints });
        } else if (picker.step === 2) {
          // Second click - bottom-right of pixel
          const p1 = picker.points[0];
          const width = Math.max(1, Math.abs(x - p1.x));
          const height = Math.max(1, Math.abs(y - p1.y));
          setOptions((prev) => ({ ...prev, pixelWidth: width, pixelHeight: height }));
          setPicker({ mode: null, step: 0, points: [] });
        }
      } else if (picker.mode === "gap") {
        if (picker.step < 4) {
          // Collecting 4 points
          setPicker({ mode: "gap", step: picker.step + 1, points: newPoints });
        }
        if (picker.step === 4) {
          // Fourth click - calculate gaps
          const p1 = picker.points[0]; // First point of horizontal pair
          const p2 = picker.points[1]; // Second point of horizontal pair
          const p3 = picker.points[2]; // First point of vertical pair
          const p4 = { x, y }; // Second point of vertical pair (current click)
          const gapX = Math.abs(p2.x - p1.x);
          const gapY = Math.abs(p4.y - p3.y);
          setOptions((prev) => ({ ...prev, gapX, gapY }));
          setPicker({ mode: null, step: 0, points: [] });
        }
      } else if (picker.mode === "gridLineOffset") {
        // Single click sets grid line offset
        setGridLineOffsetX(x);
        setGridLineOffsetY(y);
        setPicker({ mode: null, step: 0, points: [] });
      }
    },
    [picker, imageData],
  );

  // Get picker instruction text
  const getPickerInstruction = useCallback(() => {
    if (!picker.mode) return null;
    if (picker.mode === "offset") {
      return "Click on the top-left corner of the first character";
    } else if (picker.mode === "pixelSize") {
      if (picker.step === 1) return "Click on the top-left corner of a pixel";
      if (picker.step === 2) return "Click on the bottom-right corner of the same pixel";
    } else if (picker.mode === "gap") {
      if (picker.step === 1) return "Click on a point at the right edge of a character";
      if (picker.step === 2) return "Click on the corresponding point at the left edge of the next character";
      if (picker.step === 3) return "Click on a point at the bottom edge of a character";
      if (picker.step === 4) return "Click on the corresponding point at the top edge of the character below";
    } else if (picker.mode === "gridLineOffset") {
      return "Click where the first grid line intersection should appear";
    }
    return null;
  }, [picker]);

  const handleNext = useCallback(() => {
    if (step < 3) {
      setStep((step + 1) as WizardStep);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((step - 1) as WizardStep);
    }
  }, [step]);

  const handleSave = useCallback(
    async (openEditor: boolean = false) => {
      if (!parseResult || !name.trim()) {
        setSaveError("Please provide a name for the character set");
        return;
      }

      try {
        setSaving(true);
        setSaveError(null);

        const now = Date.now();
        const id = generateId();

        const characterSet = {
          metadata: {
            id,
            name: name.trim(),
            description: description.trim(),
            source: source.trim() || "yourself",
            manufacturer: manufacturer.trim(),
            system: system.trim(),
            chip: chip.trim(),
            locale: locale.trim(),
            createdAt: now,
            updatedAt: now,
            isBuiltIn: false,
          },
          config,
          characters: parseResult.characters,
        };

        await save(characterSet);

        if (openEditor) {
          router.push(`/tools/character-rom-editor/edit?id=${id}`);
        } else {
          router.push("/tools/character-rom-editor");
        }
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Failed to save character set");
      } finally {
        setSaving(false);
      }
    },
    [parseResult, name, description, source, manufacturer, system, chip, locale, config, save, router],
  );

  return (
    <div className="min-h-screen flex flex-col safe-top">
      <Header />

      <main className="flex-1 bg-retro-dark pt-24 pb-12">
        <Container size="default">
          {/* Page header */}
          <div className="mb-6">
            <Link
              href="/tools/character-rom-editor/import"
              className="text-xs text-gray-500 hover:text-retro-cyan transition-colors mb-2 inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Import
            </Link>
            <h1 className="text-2xl sm:text-3xl font-display">
              <NeonText color="pink">Import from Image</NeonText>
            </h1>
          </div>

          {/* Step indicator */}
          <ImportStepIndicator currentStep={step} totalSteps={3} labels={STEP_LABELS} />

          {/* Step content */}
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Configure */}
            {step === 1 && (
              <div className="space-y-6">
                {!imageData ? (
                  /* File upload */
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-lg font-medium text-gray-200 mb-2">Upload Image</h2>
                      <p className="text-sm text-gray-400">Select an image with a character grid</p>
                    </div>

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
                        border-retro-grid/50 hover:border-retro-pink/50 bg-retro-navy/30
                      `}
                    >
                      {loading ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-2 border-retro-pink border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-gray-400">Loading image...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-retro-pink/20 flex items-center justify-center mb-4">
                            <svg
                              className="w-8 h-8 text-retro-pink"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-300 mb-1">Drag and drop an image here</p>
                          <p className="text-xs text-gray-500 mb-3">or click to browse</p>
                          <p className="text-[10px] text-gray-600">Supports: {getSupportedImageExtensions()}</p>
                        </>
                      )}
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        <strong>Tip:</strong> For best results, use a monochrome image with characters arranged in a
                        grid.
                      </p>
                      <p>The importer will auto-detect common character sizes like 8x8, 8x16, etc.</p>
                    </div>
                  </div>
                ) : (
                  /* Configuration and preview */
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Settings */}
                    <div className="space-y-4 lg:w-80 lg:flex-shrink-0">
                      {/* Settings */}
                      <div className="card-retro p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-300">Grid Settings</h3>
                          <button
                            onClick={() => {
                              setFile(null);
                              setImageData(null);
                              setPreviewUrl(null);
                            }}
                            className="text-xs text-retro-cyan hover:text-retro-pink"
                          >
                            Change Image
                          </button>
                        </div>

                        {/* Reading order */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-gray-500">Reading Order</label>
                            {options.readingOrder !== "ltr-ttb" && (
                              <button
                                onClick={() => updateOption("readingOrder", "ltr-ttb")}
                                className="text-[10px] text-retro-cyan hover:text-retro-pink"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <select
                            value={options.readingOrder}
                            onChange={(e) => updateOption("readingOrder", e.target.value as ReadingOrder)}
                            title="Order in which characters are read from the image"
                            className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                          >
                            <option value="ltr-ttb">→ ↓ Left to right, top to bottom</option>
                            <option value="rtl-ttb">← ↓ Right to left, top to bottom</option>
                            <option value="ltr-btt">→ ↑ Left to right, bottom to top</option>
                            <option value="rtl-btt">← ↑ Right to left, bottom to top</option>
                            <option value="ttb-ltr">↓ → Top to bottom, left to right</option>
                            <option value="ttb-rtl">↓ ← Top to bottom, right to left</option>
                            <option value="btt-ltr">↑ → Bottom to top, left to right</option>
                            <option value="btt-rtl">↑ ← Bottom to top, right to left</option>
                          </select>
                        </div>

                        <div className="border-t border-retro-grid/30" />

                        {/* Standard dimension presets */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Character Size</label>
                          <DimensionPresetSelector
                            currentWidth={options.charWidth}
                            currentHeight={options.charHeight}
                            onSelect={(width, height) => {
                              updateOption("charWidth", width);
                              updateOption("charHeight", height);
                            }}
                          />
                        </div>

                        {/* Manual dimensions */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-gray-500">Char Width</label>
                              {options.charWidth !== 8 && (
                                <button
                                  onClick={() => updateOption("charWidth", 8)}
                                  className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                            <input
                              type="number"
                              min={1}
                              max={32}
                              value={options.charWidth}
                              onChange={(e) => updateOption("charWidth", parseInt(e.target.value) || 8)}
                              title="Width of each character in logical pixels (not source pixels)"
                              className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-gray-500">Char Height</label>
                              {options.charHeight !== 8 && (
                                <button
                                  onClick={() => updateOption("charHeight", 8)}
                                  className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                            <input
                              type="number"
                              min={1}
                              max={32}
                              value={options.charHeight}
                              onChange={(e) => updateOption("charHeight", parseInt(e.target.value) || 8)}
                              title="Height of each character in logical pixels (not source pixels)"
                              className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                            />
                          </div>
                        </div>

                        <div className="border-t border-retro-grid/30" />

                        {/* Grid line offset for alignment */}
                        {picker.mode === "gridLineOffset" ? (
                          <div className="p-3 bg-retro-pink/20 border border-retro-pink/50 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-retro-pink">Setting Grid Line Offset</span>
                              <button onClick={cancelPicker} className="text-[10px] text-gray-400 hover:text-white">
                                Cancel
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-300">{getPickerInstruction()}</p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs text-gray-500">Grid Line Offset</label>
                              <button
                                onClick={() => startPicker("gridLineOffset")}
                                className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-retro-pink/20 text-retro-pink hover:bg-retro-pink/30 rounded border border-retro-pink/50"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                  />
                                </svg>
                                Pick from image
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-gray-500">X</label>
                                  {gridLineOffsetX !== 0 && (
                                    <button
                                      onClick={() => setGridLineOffsetX(0)}
                                      className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="number"
                                  value={gridLineOffsetX}
                                  onChange={(e) => setGridLineOffsetX(parseInt(e.target.value) || 0)}
                                  title="Horizontal offset for alignment grid lines"
                                  className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-gray-500">Y</label>
                                  {gridLineOffsetY !== 0 && (
                                    <button
                                      onClick={() => setGridLineOffsetY(0)}
                                      className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="number"
                                  value={gridLineOffsetY}
                                  onChange={(e) => setGridLineOffsetY(parseInt(e.target.value) || 0)}
                                  title="Vertical offset for alignment grid lines"
                                  className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Rotation slider */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-gray-500">Rotation</label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{options.rotation.toFixed(2)}°</span>
                              {options.rotation !== 0 && (
                                <button
                                  onClick={() => updateOption("rotation", 0)}
                                  className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                          <input
                            type="range"
                            min={-2}
                            max={2}
                            step={0.05}
                            value={options.rotation}
                            onChange={(e) => updateOption("rotation", parseFloat(e.target.value))}
                            title="Rotate the image around the top-left corner to align skewed scans"
                            className="w-full accent-retro-pink"
                          />
                          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                            <span>-2°</span>
                            <span>0°</span>
                            <span>+2°</span>
                          </div>
                        </div>

                        <div className="border-t border-retro-grid/30" />

                        {/* Offset */}
                        {picker.mode === "offset" ? (
                          <div className="p-3 bg-retro-pink/20 border border-retro-pink/50 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-retro-pink">Setting Offset</span>
                              <button onClick={cancelPicker} className="text-[10px] text-gray-400 hover:text-white">
                                Cancel
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-300">{getPickerInstruction()}</p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs text-gray-500">Offset</label>
                              <button
                                onClick={() => startPicker("offset")}
                                className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-retro-pink/20 text-retro-pink hover:bg-retro-pink/30 rounded border border-retro-pink/50"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                  />
                                </svg>
                                Pick from image
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-gray-500">X</label>
                                  {options.offsetX !== 0 && (
                                    <button
                                      onClick={() => updateOption("offsetX", 0)}
                                      className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="number"
                                  min={0}
                                  value={options.offsetX}
                                  onChange={(e) => updateOption("offsetX", parseInt(e.target.value) || 0)}
                                  title="Horizontal offset from the left edge to the first character (in source pixels)"
                                  className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-gray-500">Y</label>
                                  {options.offsetY !== 0 && (
                                    <button
                                      onClick={() => updateOption("offsetY", 0)}
                                      className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="number"
                                  min={0}
                                  value={options.offsetY}
                                  onChange={(e) => updateOption("offsetY", parseInt(e.target.value) || 0)}
                                  title="Vertical offset from the top edge to the first character (in source pixels)"
                                  className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="border-t border-retro-grid/30" />

                        {/* Pixel size (for scaled images) */}
                        {picker.mode === "pixelSize" ? (
                          <div className="p-3 bg-retro-pink/20 border border-retro-pink/50 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-retro-pink">
                                Setting Pixel Size ({picker.step}/2)
                              </span>
                              <button onClick={cancelPicker} className="text-[10px] text-gray-400 hover:text-white">
                                Cancel
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-300">{getPickerInstruction()}</p>
                            {picker.points.length > 0 && (
                              <div className="mt-2 text-[10px] text-gray-400">
                                First point: ({picker.points[0].x}, {picker.points[0].y})
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs text-gray-500">Pixel Size</label>
                              <button
                                onClick={() => startPicker("pixelSize")}
                                className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-retro-pink/20 text-retro-pink hover:bg-retro-pink/30 rounded border border-retro-pink/50"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                  />
                                </svg>
                                Pick from image
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-gray-500">Width</label>
                                  {options.pixelWidth !== 1 && (
                                    <button
                                      onClick={() => updateOption("pixelWidth", 1)}
                                      className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={options.pixelWidth}
                                  onChange={(e) =>
                                    updateOption(
                                      "pixelWidth",
                                      Math.max(1, Math.min(100, parseInt(e.target.value) || 1)),
                                    )
                                  }
                                  title="Source pixels per logical pixel width. Use >1 for scaled/zoomed images"
                                  className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-gray-500">Height</label>
                                  {options.pixelHeight !== 1 && (
                                    <button
                                      onClick={() => updateOption("pixelHeight", 1)}
                                      className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={options.pixelHeight}
                                  onChange={(e) =>
                                    updateOption(
                                      "pixelHeight",
                                      Math.max(1, Math.min(100, parseInt(e.target.value) || 1)),
                                    )
                                  }
                                  title="Source pixels per logical pixel height. Use >1 for scaled/zoomed images"
                                  className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="border-t border-retro-grid/30" />

                        {/* Gap between characters */}
                        {picker.mode === "gap" ? (
                          <div className="p-3 bg-retro-pink/20 border border-retro-pink/50 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-retro-pink">Setting Gap ({picker.step}/4)</span>
                              <button onClick={cancelPicker} className="text-[10px] text-gray-400 hover:text-white">
                                Cancel
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-300">{getPickerInstruction()}</p>
                            {picker.points.length > 0 && (
                              <div className="mt-2 text-[10px] text-gray-400">
                                Points: {picker.points.map((p, i) => `(${p.x}, ${p.y})`).join(" → ")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs text-gray-500">Gap</label>
                              <button
                                onClick={() => startPicker("gap")}
                                className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-retro-pink/20 text-retro-pink hover:bg-retro-pink/30 rounded border border-retro-pink/50"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                  />
                                </svg>
                                Pick from image
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-gray-500">X</label>
                                  {options.gapX !== 0 && (
                                    <button
                                      onClick={() => updateOption("gapX", 0)}
                                      className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="number"
                                  min={0}
                                  value={options.gapX}
                                  onChange={(e) => updateOption("gapX", parseInt(e.target.value) || 0)}
                                  title="Horizontal gap between characters in source pixels"
                                  className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-gray-500">Y</label>
                                  {options.gapY !== 0 && (
                                    <button
                                      onClick={() => updateOption("gapY", 0)}
                                      className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="number"
                                  min={0}
                                  value={options.gapY}
                                  onChange={(e) => updateOption("gapY", parseInt(e.target.value) || 0)}
                                  title="Vertical gap between characters in source pixels"
                                  className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="border-t border-retro-grid/30" />

                        {/* Force columns/rows */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-gray-500">Columns</label>
                              {options.forceColumns !== 0 && (
                                <button
                                  onClick={() => updateOption("forceColumns", 0)}
                                  className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={256}
                              value={options.forceColumns}
                              onChange={(e) => updateOption("forceColumns", parseInt(e.target.value) || 0)}
                              title="Force number of columns. Set to 0 for automatic detection based on image width"
                              className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-gray-500">Rows</label>
                              {options.forceRows !== 0 && (
                                <button
                                  onClick={() => updateOption("forceRows", 0)}
                                  className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={256}
                              value={options.forceRows}
                              onChange={(e) => updateOption("forceRows", parseInt(e.target.value) || 0)}
                              title="Force number of rows. Set to 0 for automatic detection based on image height"
                              className="w-full px-3 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                            />
                          </div>
                        </div>

                        <div className="border-t border-retro-grid/30" />

                        {/* Threshold slider */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-gray-500">Threshold</label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{options.threshold}</span>
                              {options.threshold !== 128 && (
                                <button
                                  onClick={() => updateOption("threshold", 128)}
                                  className="text-[10px] text-retro-cyan hover:text-retro-pink"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={255}
                            value={options.threshold}
                            onChange={(e) => updateOption("threshold", parseInt(e.target.value))}
                            title="Brightness threshold for converting to black/white. Lower values = more black pixels"
                            className="w-full accent-retro-pink"
                          />
                          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                            <span>Dark (0)</span>
                            <span>Light (255)</span>
                          </div>
                        </div>

                        {/* Invert toggle */}
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            id="invert"
                            checked={options.invert}
                            onChange={(checked) => updateOption("invert", checked)}
                          />
                          <label
                            htmlFor="invert"
                            className="text-xs text-gray-400 cursor-pointer"
                            onClick={() => updateOption("invert", !options.invert)}
                          >
                            Invert colors
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right: Source image and Character preview */}
                    <div className="flex flex-col min-h-0 flex-1 gap-4">
                      {/* Source Image Preview */}
                      {previewUrl && (
                        <div className="card-retro p-3 flex-shrink-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-400">
                              Source Image
                              {picker.mode && (
                                <span className="ml-2 text-retro-pink animate-pulse">— Click to pick point</span>
                              )}
                            </span>
                            <div className="flex items-center gap-3">
                              {parseResult && (
                                <span className="text-xs text-gray-500">
                                  {parseResult.columns} × {parseResult.rows}
                                </span>
                              )}
                              {rotatedPreview.imageData && (
                                <span className="text-xs text-gray-500">
                                  {rotatedPreview.imageData.width} x {rotatedPreview.imageData.height} px
                                  {options.rotation !== 0 && ` (rotated ${options.rotation.toFixed(2)}°)`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className={`relative overflow-auto rounded bg-black/50 ${
                              picker.mode ? "cursor-crosshair ring-2 ring-retro-pink/50" : ""
                            }`}
                            style={{ width: "510px", height: "700px" }}
                            onClick={picker.mode ? handleImageClick : undefined}
                          >
                            <div
                              className="relative"
                              style={{
                                width: rotatedPreview.imageData ? rotatedPreview.imageData.width : "100%",
                                height: rotatedPreview.imageData ? rotatedPreview.imageData.height : "100%",
                                minWidth: "100%",
                                minHeight: "100%",
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={rotatedPreview.url || ""}
                                alt="Source image"
                                className="block"
                                style={{
                                  imageRendering: "pixelated",
                                  width: rotatedPreview.imageData ? rotatedPreview.imageData.width : "auto",
                                  height: rotatedPreview.imageData ? rotatedPreview.imageData.height : "auto",
                                }}
                              />
                              {/* Alignment grid lines for rotation help */}
                              {rotatedPreview.imageData && (
                                <svg
                                  className="absolute top-0 left-0 pointer-events-none"
                                  style={{
                                    width: rotatedPreview.imageData.width,
                                    height: rotatedPreview.imageData.height,
                                  }}
                                  viewBox={`0 0 ${rotatedPreview.imageData.width} ${rotatedPreview.imageData.height}`}
                                >
                                  {/* Horizontal lines every 50 pixels with offset */}
                                  {Array.from({ length: Math.ceil((rotatedPreview.imageData.height + 50) / 50) }).map(
                                    (_, i) => {
                                      const y = gridLineOffsetY + i * 50;
                                      if (y < 0 || y > rotatedPreview.imageData!.height) return null;
                                      return (
                                        <line
                                          key={`h-line-${i}`}
                                          x1={0}
                                          y1={y}
                                          x2={rotatedPreview.imageData!.width}
                                          y2={y}
                                          stroke={i % 2 === 0 ? "rgba(0, 255, 255, 0.8)" : "rgba(0, 255, 255, 0.5)"}
                                          strokeWidth={i % 2 === 0 ? 2 : 1}
                                          strokeDasharray={i % 2 === 0 ? "none" : "4,4"}
                                        />
                                      );
                                    },
                                  )}
                                  {/* Vertical lines every 50 pixels with offset */}
                                  {Array.from({ length: Math.ceil((rotatedPreview.imageData.width + 50) / 50) }).map(
                                    (_, i) => {
                                      const x = gridLineOffsetX + i * 50;
                                      if (x < 0 || x > rotatedPreview.imageData!.width) return null;
                                      return (
                                        <line
                                          key={`v-line-${i}`}
                                          x1={x}
                                          y1={0}
                                          x2={x}
                                          y2={rotatedPreview.imageData!.height}
                                          stroke={i % 2 === 0 ? "rgba(0, 255, 255, 0.8)" : "rgba(0, 255, 255, 0.5)"}
                                          strokeWidth={i % 2 === 0 ? 2 : 1}
                                          strokeDasharray={i % 2 === 0 ? "none" : "4,4"}
                                        />
                                      );
                                    },
                                  )}
                                </svg>
                              )}
                              {/* Recognized pixels overlay */}
                              {rotatedPreview.imageData && parseResult && (
                                <svg
                                  className="absolute top-0 left-0 pointer-events-none"
                                  style={{
                                    width: rotatedPreview.imageData.width,
                                    height: rotatedPreview.imageData.height,
                                  }}
                                  viewBox={`0 0 ${rotatedPreview.imageData.width} ${rotatedPreview.imageData.height}`}
                                >
                                  {/* Render recognized pixels for each character */}
                                  {Array.from({ length: parseResult.rows }).map((_, row) =>
                                    Array.from({ length: parseResult.columns }).map((_, col) => {
                                      const charIndex = getCharIndexForGridPosition(
                                        row,
                                        col,
                                        parseResult.rows,
                                        parseResult.columns,
                                      );
                                      if (charIndex >= parseResult.characters.length) return null;

                                      const character = parseResult.characters[charIndex];
                                      // Character size in source pixels
                                      const srcCharWidth = options.charWidth * options.pixelWidth;
                                      const srcCharHeight = options.charHeight * options.pixelHeight;
                                      const srcGapX = options.gapX;
                                      const srcGapY = options.gapY;

                                      const charX = options.offsetX + col * (srcCharWidth + srcGapX);
                                      const charY = options.offsetY + row * (srcCharHeight + srcGapY);

                                      // Render each "on" pixel
                                      return character.pixels.map((pixelRow, py) =>
                                        pixelRow.map((isOn, px) => {
                                          if (!isOn) return null;
                                          return (
                                            <rect
                                              key={`recognized-${charIndex}-${py}-${px}`}
                                              x={charX + px * options.pixelWidth}
                                              y={charY + py * options.pixelHeight}
                                              width={options.pixelWidth}
                                              height={options.pixelHeight}
                                              fill="rgba(0, 255, 0, 0.5)"
                                            />
                                          );
                                        }),
                                      );
                                    }),
                                  )}
                                </svg>
                              )}
                              {/* Character grid overlay */}
                              {rotatedPreview.imageData && parseResult && (
                                <svg
                                  className="absolute top-0 left-0 pointer-events-none"
                                  style={{
                                    width: rotatedPreview.imageData.width,
                                    height: rotatedPreview.imageData.height,
                                  }}
                                  viewBox={`0 0 ${rotatedPreview.imageData.width} ${rotatedPreview.imageData.height}`}
                                >
                                  {/* Render character cells */}
                                  {Array.from({ length: parseResult.rows }).map((_, row) =>
                                    Array.from({ length: parseResult.columns }).map((_, col) => {
                                      const charIndex = getCharIndexForGridPosition(
                                        row,
                                        col,
                                        parseResult.rows,
                                        parseResult.columns,
                                      );
                                      if (charIndex >= parseResult.characters.length) return null;

                                      // Calculate source pixel position for this character
                                      // Character size in source pixels
                                      const srcCharWidth = options.charWidth * options.pixelWidth;
                                      const srcCharHeight = options.charHeight * options.pixelHeight;
                                      // Gap and offset are already in source pixels (not multiplied by pixel size)
                                      const srcGapX = options.gapX;
                                      const srcGapY = options.gapY;

                                      const x = options.offsetX + col * (srcCharWidth + srcGapX);
                                      const y = options.offsetY + row * (srcCharHeight + srcGapY);

                                      return (
                                        <g key={`char-${row}-${col}`}>
                                          {/* Character boundary */}
                                          <rect
                                            x={x}
                                            y={y}
                                            width={srcCharWidth}
                                            height={srcCharHeight}
                                            fill="rgba(236, 72, 153, 0.25)"
                                            stroke="rgba(236, 72, 153, 0.85)"
                                            strokeWidth={1}
                                          />
                                          {/* Pixel grid within character (only show if pixel size > 1) */}
                                          {(options.pixelWidth > 1 || options.pixelHeight > 1) &&
                                            Array.from({ length: options.charHeight }).map((_, py) =>
                                              Array.from({ length: options.charWidth }).map((_, px) => (
                                                <rect
                                                  key={`pixel-${py}-${px}`}
                                                  x={x + px * options.pixelWidth}
                                                  y={y + py * options.pixelHeight}
                                                  width={options.pixelWidth}
                                                  height={options.pixelHeight}
                                                  fill="none"
                                                  stroke="rgba(80, 200, 220, 0.6)"
                                                  strokeWidth={0.5}
                                                />
                                              )),
                                            )}
                                        </g>
                                      );
                                    }),
                                  )}
                                </svg>
                              )}
                              {/* Picker points overlay */}
                              {picker.mode && picker.points.length > 0 && rotatedPreview.imageData && (
                                <svg
                                  className="absolute top-0 left-0 pointer-events-none"
                                  style={{
                                    width: rotatedPreview.imageData.width,
                                    height: rotatedPreview.imageData.height,
                                  }}
                                  viewBox={`0 0 ${rotatedPreview.imageData.width} ${rotatedPreview.imageData.height}`}
                                >
                                  {picker.points.map((point, idx) => (
                                    <g key={`picker-point-${idx}`}>
                                      {/* Crosshair */}
                                      <line
                                        x1={point.x - 10}
                                        y1={point.y}
                                        x2={point.x + 10}
                                        y2={point.y}
                                        stroke="#00ff00"
                                        strokeWidth={2}
                                      />
                                      <line
                                        x1={point.x}
                                        y1={point.y - 10}
                                        x2={point.x}
                                        y2={point.y + 10}
                                        stroke="#00ff00"
                                        strokeWidth={2}
                                      />
                                      {/* Point marker */}
                                      <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r={4}
                                        fill="#00ff00"
                                        stroke="white"
                                        strokeWidth={1}
                                      />
                                      {/* Point label */}
                                      <text
                                        x={point.x + 8}
                                        y={point.y - 8}
                                        fill="#00ff00"
                                        fontSize={12}
                                        fontWeight="bold"
                                      >
                                        {idx + 1}
                                      </text>
                                    </g>
                                  ))}
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Character Preview */}
                      <div className="card-retro p-3 flex flex-col flex-1 min-h-[300px] lg:min-h-[400px]">
                        <div className="flex items-center justify-between mb-2 flex-shrink-0">
                          <span className="text-xs font-medium text-gray-400">
                            Preview ({parseResult?.characters.length || 0} characters)
                          </span>
                          {parseResult && (
                            <span className="text-xs text-gray-500">
                              {parseResult.columns} x {parseResult.rows} grid
                              {previewDimensions.scale > 1 && ` - ${previewDimensions.scale}x`}
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
                              config={config}
                              maxCharacters={512}
                              maxWidth={previewDimensions.maxWidth}
                              maxHeight={previewDimensions.maxHeight}
                              scale={previewDimensions.scale}
                              forceColumns={parseResult.columns}
                              showCharacterBorders
                              characterBorderColor="rgba(236, 72, 153, 0.4)"
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
                        <div className="text-xs text-gray-500 space-y-1 flex-shrink-0">
                          <p>
                            Characters will be imported at {options.charWidth}x{options.charHeight} pixels.
                          </p>
                          <p>Adjust threshold if characters appear too light or too dark.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleNext} disabled={!canProceedStep1} variant="pink">
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Metadata */}
            {step === 2 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <MetadataStep
                  name={name}
                  onNameChange={setName}
                  description={description}
                  onDescriptionChange={setDescription}
                  manufacturer={manufacturer}
                  onManufacturerChange={setManufacturer}
                  system={system}
                  onSystemChange={setSystem}
                  chip={chip}
                  onChipChange={setChip}
                  locale={locale}
                  onLocaleChange={setLocale}
                  source={source}
                  onSourceChange={setSource}
                />

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button onClick={handleBack} variant="ghost">
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={!canProceedStep2} variant="pink">
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Preview and Save */}
            {step === 3 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-medium text-gray-200 mb-2">Review & Save</h2>
                  <p className="text-sm text-gray-400">Review your character set and save to library</p>
                </div>

                {/* Summary */}
                <div className="card-retro p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-200">{name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Characters:</span>
                      <span className="ml-2 text-gray-200">{characters.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Dimensions:</span>
                      <span className="ml-2 text-gray-200">
                        {config.width}x{config.height}
                      </span>
                    </div>
                    {description && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Description:</span>
                        <span className="ml-2 text-gray-200">{description}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="card-retro p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-300">Preview</span>
                    <span className="text-xs text-gray-500">
                      {config.width}x{config.height} - {characters.length} characters
                    </span>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4">
                    <CharacterPreview
                      characters={characters}
                      config={config}
                      maxCharacters={256}
                      maxWidth={600}
                      maxHeight={400}
                      scale={2}
                    />
                  </div>
                </div>

                {/* Error message */}
                {saveError && <div className="text-sm text-red-400 text-center">{saveError}</div>}

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button onClick={handleBack} variant="ghost">
                    Back
                  </Button>
                  <div className="flex gap-3">
                    <Button onClick={() => handleSave(false)} disabled={!canSave || saving} variant="cyan">
                      {saving ? "Saving..." : "Save to Library"}
                    </Button>
                    <Button onClick={() => handleSave(true)} disabled={!canSave || saving} variant="pink">
                      {saving ? "Saving..." : "Save & Edit"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
