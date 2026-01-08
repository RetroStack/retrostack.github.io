"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NeonText } from "@/components/effects/NeonText";
import { CharacterPreview } from "@/components/character-editor/character/CharacterPreview";
import { ImportStepIndicator } from "@/components/character-editor/import/ImportStepIndicator";
import { MetadataStep } from "@/components/character-editor/import/MetadataStep";
import { DimensionPresetSelector } from "@/components/character-editor/selectors/DimensionPresetSelector";
import { useCharacterLibrary } from "@/hooks/character-editor";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import {
  ImageImportOptions,
  getDefaultImageImportOptions,
  loadImageData,
  parseImageToCharacters,
  detectCharacterDimensions,
  isValidImageFile,
  getSupportedImageExtensions,
} from "@/lib/character-editor/import/imageImport";
import { CharacterSetConfig, Character, generateId } from "@/lib/character-editor/types";

type WizardStep = 1 | 2 | 3;

const STEP_LABELS = ["Configure", "Metadata", "Save"];

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
  const [options, setOptions] = useState<ImageImportOptions>(
    getDefaultImageImportOptions()
  );

  // Dimension suggestions
  const [suggestions, setSuggestions] = useState<
    { width: number; height: number; columns: number; rows: number }[]
  >([]);

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

  // Parse result
  const parseResult = useMemo(() => {
    if (!imageData) return null;
    return parseImageToCharacters(imageData, options);
  }, [imageData, options]);

  // Characters from parse result
  const characters: Character[] = parseResult?.characters || [];

  // Config derived from options
  const config: CharacterSetConfig = useMemo(() => ({
    width: options.charWidth,
    height: options.charHeight,
    padding: "right",
    bitDirection: "ltr",
  }), [options.charWidth, options.charHeight]);

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
      setError(
        `Invalid file type. Please select an image file (${getSupportedImageExtensions()})`
      );
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

      const detected = detectCharacterDimensions(data.width, data.height);
      setSuggestions(detected);

      if (detected.length > 0) {
        setOptions((prev) => ({
          ...prev,
          charWidth: detected[0].width,
          charHeight: detected[0].height,
        }));
      }

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
    [handleFileSelect]
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
    [handleFileSelect]
  );

  // Update option handlers
  const updateOption = useCallback(
    <K extends keyof ImageImportOptions>(key: K, value: ImageImportOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

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
    [parseResult, name, description, source, manufacturer, system, chip, locale, config, save, router]
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
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Import
            </Link>
            <h1 className="text-2xl sm:text-3xl font-display">
              <NeonText color="pink">Import from Image</NeonText>
            </h1>
          </div>

          {/* Step indicator */}
          <ImportStepIndicator
            currentStep={step}
            totalSteps={3}
            labels={STEP_LABELS}
          />

          {/* Step content */}
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Configure */}
            {step === 1 && (
              <div className="space-y-6">
                {!imageData ? (
                  /* File upload */
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-lg font-medium text-gray-200 mb-2">
                        Upload Image
                      </h2>
                      <p className="text-sm text-gray-400">
                        Select an image with a character grid
                      </p>
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
                  <div className="flex flex-col lg:flex-row gap-6">
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
                            className="w-full accent-retro-pink"
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
                            className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-pink focus:ring-retro-pink"
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

                {/* Navigation */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedStep1}
                    variant="pink"
                  >
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
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedStep2}
                    variant="pink"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Preview and Save */}
            {step === 3 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-medium text-gray-200 mb-2">
                    Review & Save
                  </h2>
                  <p className="text-sm text-gray-400">
                    Review your character set and save to library
                  </p>
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
                      <span className="ml-2 text-gray-200">{config.width}x{config.height}</span>
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
                    <span className="text-sm font-medium text-gray-300">
                      Preview
                    </span>
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
                {saveError && (
                  <div className="text-sm text-red-400 text-center">
                    {saveError}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button onClick={handleBack} variant="ghost">
                    Back
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSave(false)}
                      disabled={!canSave || saving}
                      variant="cyan"
                    >
                      {saving ? "Saving..." : "Save to Library"}
                    </Button>
                    <Button
                      onClick={() => handleSave(true)}
                      disabled={!canSave || saving}
                      variant="pink"
                    >
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
