"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NeonText } from "@/components/effects/NeonText";
import { ImportDropZone } from "@/components/character-editor/import/ImportDropZone";
import { CharacterPreview } from "@/components/character-editor/character/CharacterPreview";
import { ImportStepIndicator } from "@/components/character-editor/import/ImportStepIndicator";
import { MetadataStep } from "@/components/character-editor/import/MetadataStep";
import { SizePresetDropdown } from "@/components/character-editor/selectors/SizePresetDropdown";
import { ImportFromImageModal } from "./modals/ImportFromImageModal";
import { ImportFromFontModal } from "./modals/ImportFromFontModal";
import { ImportFromTextModal } from "./modals/ImportFromTextModal";
import { useCharacterLibrary } from "@/hooks/character-editor";
import {
  CharacterSetConfig,
  PaddingDirection,
  BitDirection,
  Character,
  createDefaultConfig,
  generateId,
} from "@/lib/character-editor/types";
import { parseCharacterRom } from "@/lib/character-editor/import/binary";
import { calculateCharacterCount, formatFileSize } from "@/lib/character-editor/utils";

type WizardStep = 1 | 2 | 3;

const STEP_LABELS = ["Upload", "Metadata", "Configure"];

// Example files available for quick import
interface ExampleFile {
  name: string;
  description: string;
  path: string;
  suggestedName: string;
  suggestedDescription: string;
  suggestedWidth: number;
  suggestedHeight: number;
  characterCount: number;
}

const EXAMPLE_FILES: ExampleFile[] = [
  {
    name: "Cyber",
    description: "128 characters, 8×8 pixels",
    path: "/examples/cyber-8x8-128.bin",
    suggestedName: "Cyber",
    suggestedDescription: "Cyber-style character set",
    suggestedWidth: 8,
    suggestedHeight: 8,
    characterCount: 128,
  },
];

/**
 * Import view for the Character ROM Editor - Multi-step wizard
 */
export function ImportView() {
  const router = useRouter();
  const { save } = useCharacterLibrary();

  // Current step
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1: File state
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 2: Metadata state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [system, setSystem] = useState("");
  const [chip, setChip] = useState("");
  const [locale, setLocale] = useState("");
  const [source, setSource] = useState("");

  // Step 3: Config state
  const [config, setConfig] = useState<CharacterSetConfig>(createDefaultConfig());

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Image import modal state
  const [showImageImport, setShowImageImport] = useState(false);

  // Font import modal state
  const [showFontImport, setShowFontImport] = useState(false);

  // Text/code import modal state
  const [showTextImport, setShowTextImport] = useState(false);

  // State for imported characters from image (bypasses file parsing)
  const [importedCharacters, setImportedCharacters] = useState<Character[] | null>(null);

  // Parse characters from file data (or use imported characters)
  const characters = useMemo(() => {
    // Use imported characters if available (from image import)
    if (importedCharacters) return importedCharacters;
    if (!fileData) return [];
    try {
      return parseCharacterRom(fileData, config);
    } catch {
      return [];
    }
  }, [fileData, config, importedCharacters]);

  // Calculate character count for preview info
  const characterCount = useMemo(() => {
    if (!file?.size) return 0;
    return calculateCharacterCount(file.size, config);
  }, [file?.size, config]);

  const bytesPerChar = useMemo(() => {
    const bytesPerLine = Math.ceil(config.width / 8);
    return bytesPerLine * config.height;
  }, [config.width, config.height]);

  // Step validation
  const canProceedStep1 = file && fileData;
  const canProceedStep2 = name.trim().length > 0;
  const canSave = canProceedStep1 && canProceedStep2 && characters.length > 0;

  // Handlers
  const handleFileSelect = useCallback((selectedFile: File, data: ArrayBuffer) => {
    setFile(selectedFile);
    setFileData(data);
    setUploadError(null);

    // Set default name from filename
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
    setName(baseName);
  }, []);

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

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 16) {
        setConfig((prev) => ({ ...prev, width: value }));
      }
    },
    []
  );

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 16) {
        setConfig((prev) => ({ ...prev, height: value }));
      }
    },
    []
  );

  const handlePaddingChange = useCallback((padding: PaddingDirection) => {
    setConfig((prev) => ({ ...prev, padding }));
  }, []);

  const handleBitDirectionChange = useCallback((bitDirection: BitDirection) => {
    setConfig((prev) => ({ ...prev, bitDirection }));
  }, []);

  const handlePresetClick = useCallback((width: number, height: number) => {
    setConfig((prev) => ({ ...prev, width, height }));
  }, []);

  // Handler for image import completion
  const handleImageImport = useCallback(
    (chars: Character[], importedConfig: CharacterSetConfig) => {
      // Store imported characters directly
      setImportedCharacters(chars);

      // Update config to match imported dimensions
      setConfig(importedConfig);

      // Create a synthetic file for display
      const blob = new Blob([new ArrayBuffer(0)], { type: "application/octet-stream" });
      const syntheticFile = new File([blob], "imported-from-image.bin");
      setFile(syntheticFile);
      setFileData(new ArrayBuffer(0));

      // Set a default name
      setName("Imported Character Set");

      // Close modal and go to step 2
      setShowImageImport(false);
      setStep(2);
    },
    []
  );

  // Handler for font import completion
  const handleFontImport = useCallback(
    (chars: Character[], importedConfig: CharacterSetConfig, fontName: string) => {
      // Store imported characters directly
      setImportedCharacters(chars);

      // Update config to match imported dimensions
      setConfig(importedConfig);

      // Create a synthetic file for display
      const blob = new Blob([new ArrayBuffer(0)], { type: "application/octet-stream" });
      const syntheticFile = new File([blob], "imported-from-font.bin");
      setFile(syntheticFile);
      setFileData(new ArrayBuffer(0));

      // Set name from font
      setName(fontName || "Imported Font");

      // Close modal and go to step 2
      setShowFontImport(false);
      setStep(2);
    },
    []
  );

  // Handler for text/code import completion
  const handleTextImport = useCallback(
    (chars: Character[], importedConfig: CharacterSetConfig) => {
      // Store imported characters directly
      setImportedCharacters(chars);

      // Update config to match imported dimensions
      setConfig(importedConfig);

      // Create a synthetic file for display
      const blob = new Blob([new ArrayBuffer(0)], { type: "application/octet-stream" });
      const syntheticFile = new File([blob], "imported-from-code.bin");
      setFile(syntheticFile);
      setFileData(new ArrayBuffer(0));

      // Set a default name
      setName("Imported Character Set");

      // Close modal and go to step 2
      setShowTextImport(false);
      setStep(2);
    },
    []
  );

  const handleLoadExample = useCallback(async (example: ExampleFile) => {
    try {
      setUploadError(null);

      // Fetch the example file
      const response = await fetch(example.path);
      if (!response.ok) {
        throw new Error(`Failed to load example file: ${response.statusText}`);
      }

      const data = await response.arrayBuffer();

      // Create a File object for consistency
      const fileName = example.path.split("/").pop() || "example.bin";
      const exampleFile = new File([data], fileName, { type: "application/octet-stream" });

      setFile(exampleFile);
      setFileData(data);

      // Pre-fill metadata
      setName(example.suggestedName);
      setDescription(example.suggestedDescription);

      // Pre-fill config with suggested dimensions
      setConfig((prev) => ({
        ...prev,
        width: example.suggestedWidth,
        height: example.suggestedHeight,
      }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Failed to load example file");
    }
  }, []);

  const handleSave = useCallback(
    async (openEditor: boolean = false) => {
      if (!fileData || !name.trim()) {
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
          characters,
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
    [fileData, name, description, source, manufacturer, system, chip, locale, config, characters, save, router]
  );

  return (
    <div className="min-h-screen flex flex-col safe-top">
      <Header />

      <main className="flex-1 bg-retro-dark pt-24 pb-12">
        <Container size="default">
          {/* Page header */}
          <div className="mb-6">
            <Link
              href="/tools/character-rom-editor"
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
              Back to Library
            </Link>
            <h1 className="text-2xl sm:text-3xl font-display">
              <NeonText color="cyan">Import Character ROM</NeonText>
            </h1>
          </div>

          {/* Step indicator */}
          <ImportStepIndicator
            currentStep={step}
            totalSteps={3}
            labels={STEP_LABELS}
          />

          {/* Step content */}
          <div className="max-w-2xl mx-auto">
            {/* Step 1: Upload */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-medium text-gray-200 mb-2">
                    Upload ROM File
                  </h2>
                  <p className="text-sm text-gray-400">
                    Select a binary ROM file containing character data
                  </p>
                </div>

                <ImportDropZone
                  onFileSelect={handleFileSelect}
                  selectedFile={file}
                  loading={false}
                  error={uploadError}
                />

                {file && (
                  <div className="text-center text-sm text-gray-400">
                    <span className="text-retro-cyan">{file.name}</span>
                    <span className="mx-2">-</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                )}

                {/* Alternative import options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Import from Image option */}
                  <div className="card-retro p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-retro-pink"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-200">
                        From Image
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Extract from PNG/image with a character grid.
                    </p>
                    <Button
                      variant="pink"
                      size="sm"
                      onClick={() => setShowImageImport(true)}
                      className="w-full"
                    >
                      Choose Image
                    </Button>
                  </div>

                  {/* Import from Font option */}
                  <div className="card-retro p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-retro-cyan"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M12 6v14"
                        />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-200">
                        From Font
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Rasterize TTF/OTF/WOFF font files.
                    </p>
                    <Button
                      variant="cyan"
                      size="sm"
                      onClick={() => setShowFontImport(true)}
                      className="w-full"
                    >
                      Choose Font
                    </Button>
                  </div>

                  {/* Import from Code option */}
                  <div className="card-retro p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-retro-violet"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-200">
                        From Code
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Paste byte arrays from C, JS, or Assembly.
                    </p>
                    <Button
                      variant="violet"
                      size="sm"
                      onClick={() => setShowTextImport(true)}
                      className="w-full"
                    >
                      Paste Code
                    </Button>
                  </div>
                </div>

                {/* Example files */}
                {EXAMPLE_FILES.length > 0 && (
                  <div className="card-retro p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-retro-cyan"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-200">
                        Quick Start with Example Files
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {EXAMPLE_FILES.map((example) => (
                        <button
                          key={example.path}
                          onClick={() => handleLoadExample(example)}
                          className="w-full flex items-center gap-4 p-3 bg-retro-dark/50 border border-retro-grid/50 rounded-lg hover:border-retro-cyan hover:bg-retro-cyan/5 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-retro-purple/20 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-retro-purple group-hover:text-retro-cyan transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-gray-200 group-hover:text-retro-cyan transition-colors">
                              {example.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {example.description}
                            </div>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-600 group-hover:text-retro-cyan transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      ))}
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
              <div className="space-y-6">
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
                    variant="cyan"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Configure and Preview */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-medium text-gray-200 mb-2">
                    Configure Binary Format
                  </h2>
                  <p className="text-sm text-gray-400">
                    Adjust settings until the preview looks correct
                  </p>
                </div>

                {/* Configuration */}
                <div className="card-retro p-4 space-y-5">
                  {/* Dimensions */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3">
                      Character Dimensions
                    </h3>
                    <div className="grid grid-cols-2 gap-4 max-w-xs">
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
                          className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
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
                          className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan"
                        />
                      </div>
                    </div>

                    {/* Quick presets */}
                    <div className="mt-3">
                      <SizePresetDropdown
                        currentWidth={config.width}
                        currentHeight={config.height}
                        onSelect={handlePresetClick}
                      />
                    </div>
                  </div>

                  {/* Binary options row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Padding direction */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-2">
                        Bit Padding
                      </h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePaddingChange("right")}
                          className={`
                            flex-1 px-3 py-1.5 text-xs rounded border transition-colors
                            ${
                              config.padding === "right"
                                ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                                : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                            }
                          `}
                        >
                          Right
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePaddingChange("left")}
                          className={`
                            flex-1 px-3 py-1.5 text-xs rounded border transition-colors
                            ${
                              config.padding === "left"
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
                      <h3 className="text-sm font-medium text-gray-300 mb-2">
                        Bit Direction
                      </h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleBitDirectionChange("ltr")}
                          className={`
                            flex-1 px-3 py-1.5 text-xs rounded border transition-colors
                            ${
                              config.bitDirection === "ltr"
                                ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                                : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                            }
                          `}
                        >
                          Left to Right
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBitDirectionChange("rtl")}
                          className={`
                            flex-1 px-3 py-1.5 text-xs rounded border transition-colors
                            ${
                              config.bitDirection === "rtl"
                                ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                                : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                            }
                          `}
                        >
                          Right to Left
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  {file && (
                    <div className="text-xs text-gray-500 pt-2 border-t border-retro-grid/30">
                      {bytesPerChar} bytes/char = {characterCount} characters
                    </div>
                  )}
                </div>

                {/* Preview - full width, larger */}
                <div className="card-retro p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-300">
                      Preview
                    </span>
                    <span className="text-xs text-gray-500">
                      {config.width}x{config.height} - {characters.length} character
                      {characters.length !== 1 ? "s" : ""} detected
                    </span>
                  </div>

                  {characters.length > 0 ? (
                    <div>
                      <div className="bg-black/50 rounded-lg p-4">
                        <CharacterPreview
                          characters={characters}
                          config={config}
                          maxCharacters={512}
                          maxWidth={600}
                          maxHeight={8192}
                          scale={2}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        If scrambled, try adjusting dimensions or bit settings above.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <svg
                        className="w-12 h-12 text-gray-600 mb-3"
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

      {/* Image Import Modal */}
      <ImportFromImageModal
        isOpen={showImageImport}
        onClose={() => setShowImageImport(false)}
        onImport={handleImageImport}
      />

      {/* Font Import Modal */}
      <ImportFromFontModal
        isOpen={showFontImport}
        onClose={() => setShowFontImport(false)}
        onImport={handleFontImport}
      />

      {/* Text/Code Import Modal */}
      <ImportFromTextModal
        isOpen={showTextImport}
        onClose={() => setShowTextImport(false)}
        onImport={handleTextImport}
      />
    </div>
  );
}
