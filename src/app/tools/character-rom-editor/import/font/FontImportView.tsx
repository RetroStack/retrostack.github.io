"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
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
import { useEditorReturn } from "@/hooks/character-editor/useEditorReturn";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import {
  FontImportOptions,
  getDefaultFontImportOptions,
  isValidFontFile,
  getSupportedFontExtensions,
  getCharacterRangePreview,
  FontParseResult,
  FontParseController,
} from "@/lib/character-editor/import/fontImport";
import { CharacterSetConfig, Character, generateId } from "@/lib/character-editor/types";
import { CHARACTER_RANGE_PRESETS } from "@/lib/character-editor/presets";

type WizardStep = 1 | 2 | 3;

const STEP_LABELS = ["Configure", "Metadata", "Save"];
const DEBOUNCE_DELAY = 200;

/**
 * Font import view - Rasterize characters from TTF/OTF/WOFF font files
 */
export function FontImportView() {
  const router = useRouter();
  const { save } = useCharacterLibrary();
  const { buildEditorReturnParams } = useEditorReturn();
  const editorParams = buildEditorReturnParams();
  const importHubUrl = editorParams
    ? `/tools/character-rom-editor/import?${editorParams}`
    : "/tools/character-rom-editor/import";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ref: previewContainerRef, size: previewSize } = useResizeObserver<HTMLDivElement>();

  // Font parse controller for cancellation support
  const parseControllerRef = useRef<FontParseController | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Current step
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1: File state
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<FontParseResult | null>(null);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);

  // Import options
  const [options, setOptions] = useState<FontImportOptions>(
    getDefaultFontImportOptions()
  );

  // Step 2: Metadata state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [system, setSystem] = useState("");
  const [chip, setChip] = useState("");
  const [locale, setLocale] = useState("");
  const [source, setSource] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preview of character range
  const rangePreview = useMemo(
    () => getCharacterRangePreview(options.startCode, options.endCode),
    [options.startCode, options.endCode]
  );

  // Character count
  const characterCount = options.endCode - options.startCode + 1;

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

  // Step validation
  const canProceedStep1 = parseResult && parseResult.characters.length > 0 && !loading;
  const canProceedStep2 = name.trim().length > 0;
  const canSave = canProceedStep1 && canProceedStep2;

  // Parse font when file or options change (with debouncing)
  useEffect(() => {
    if (!file) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    parseControllerRef.current?.cancel();

    debounceTimeoutRef.current = setTimeout(() => {
      const parseFont = async () => {
        const controller = new FontParseController();
        parseControllerRef.current = controller;

        setLoading(true);
        setError(null);
        setProgress(null);

        try {
          const result = await controller.parse(file, options, (processed, total) => {
            if (!controller.isCancelled()) {
              setProgress({ processed, total });
            }
          });

          if (!controller.isCancelled()) {
            setParseResult(result);
            setProgress(null);
            setLoading(false);

            // Set default name from font family if not already set
            if (!name && result.fontFamily) {
              setName(result.fontFamily);
            }
          }
        } catch (e) {
          if (controller.isCancelled()) {
            return;
          }

          const message = e instanceof Error ? e.message : "Failed to parse font";

          if (message === "Cancelled") {
            return;
          }

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
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      parseControllerRef.current?.cancel();
    };
  }, [file, options, name]);

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
            tags,
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
    [parseResult, name, description, source, manufacturer, system, chip, locale, tags, config, save, router]
  );

  return (
    <div className="min-h-screen flex flex-col safe-top">
      <Header />

      <main className="flex-1 bg-retro-dark pt-24 pb-12">
        <Container size="default">
          {/* Page header */}
          <div className="mb-6">
            <Link
              href={importHubUrl}
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
              <NeonText color="amber">Import from Font</NeonText>
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
                {!file ? (
                  /* File upload */
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-lg font-medium text-gray-200 mb-2">
                        Upload Font File
                      </h2>
                      <p className="text-sm text-gray-400">
                        Select a TTF, OTF, or WOFF font file
                      </p>
                    </div>

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
                      className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-retro-grid/50 hover:border-retro-amber/50 bg-retro-navy/30"
                    >
                      <div className="w-16 h-16 rounded-full bg-retro-amber/20 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-retro-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M12 6v14" />
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
                  <div className="flex flex-col lg:flex-row gap-6">
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

                        <div className="text-xs text-gray-500">
                          <span className="text-gray-400">{characterCount} characters:</span>{" "}
                          <span className="font-mono">{rangePreview.join("")}</span>
                        </div>
                      </div>

                      {/* Rendering options */}
                      <div className="card-retro p-4 space-y-4">
                        <h3 className="text-sm font-medium text-gray-300">Rendering Options</h3>

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
                            <span className="text-xs text-retro-purple">Processing...</span>
                          )}
                          {parseResult && !loading && (
                            <span className="text-xs text-gray-500">
                              {parseResult.importedCount} glyphs, {parseResult.missingCount} missing
                              {previewDimensions.scale > 1 && ` - ${previewDimensions.scale}x`}
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
                            <div className="w-10 h-10 border-2 border-retro-purple border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-sm text-gray-400">
                              {progress
                                ? `Rendering ${progress.processed} of ${progress.total} characters...`
                                : "Preparing font..."}
                            </p>
                            {progress && (
                              <div className="w-48 h-1 bg-retro-navy/50 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="h-full bg-retro-purple transition-all duration-150"
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
                              config={config}
                              maxCharacters={512}
                              maxWidth={previewDimensions.maxWidth}
                              maxHeight={previewDimensions.maxHeight}
                              scale={previewDimensions.scale}
                              showCharacterBorders
                              characterBorderColor="rgba(168, 85, 247, 0.4)"
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

                {/* Navigation */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedStep1}
                    variant="cyan"
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
                  tags={tags}
                  onTagsChange={setTags}
                />

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button onClick={handleBack} variant="ghost">
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedStep2}
                    variant="cyan"
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
                    {parseResult && (
                      <div>
                        <span className="text-gray-500">Font:</span>
                        <span className="ml-2 text-gray-200">{parseResult.fontFamily}</span>
                      </div>
                    )}
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
