"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NeonText } from "@/components/effects/NeonText";
import {
  ImportDropZone,
  CharacterPreview,
  MakerSystemSelect,
  ImportStepIndicator,
  SizePresetDropdown,
} from "@/components/character-editor";
import { useCharacterLibrary } from "@/hooks/character-editor";
import {
  CharacterSetConfig,
  createDefaultConfig,
  parseCharacterRom,
  generateId,
  PaddingDirection,
  BitDirection,
  calculateCharacterCount,
  formatFileSize,
} from "@/lib/character-editor";

type WizardStep = 1 | 2 | 3;

const STEP_LABELS = ["Upload", "Metadata", "Configure"];

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
  const [maker, setMaker] = useState("");
  const [system, setSystem] = useState("");
  const [source, setSource] = useState("");

  // Step 3: Config state
  const [config, setConfig] = useState<CharacterSetConfig>(createDefaultConfig());

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Parse characters from file data
  const characters = useMemo(() => {
    if (!fileData) return [];
    try {
      return parseCharacterRom(fileData, config);
    } catch {
      return [];
    }
  }, [fileData, config]);

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
            maker: maker.trim(),
            system: system.trim(),
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
    [fileData, name, description, source, maker, system, config, characters, save, router]
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
                <div className="text-center mb-6">
                  <h2 className="text-lg font-medium text-gray-200 mb-2">
                    Character Set Details
                  </h2>
                  <p className="text-sm text-gray-400">
                    Add information about this character set
                  </p>
                </div>

                <div className="card-retro p-6 space-y-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-300 mb-1.5"
                    >
                      Name <span className="text-retro-pink">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Character Set"
                      className="w-full px-4 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-300 mb-1.5"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description..."
                      rows={2}
                      className="w-full px-4 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50 resize-none"
                    />
                  </div>

                  {/* Maker and System */}
                  <MakerSystemSelect
                    maker={maker}
                    system={system}
                    onMakerChange={setMaker}
                    onSystemChange={setSystem}
                  />

                  {/* Source */}
                  <div>
                    <label
                      htmlFor="source"
                      className="block text-sm font-medium text-gray-300 mb-1.5"
                    >
                      Source
                    </label>
                    <input
                      type="text"
                      id="source"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="Where did this ROM come from?"
                      className="w-full px-4 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50"
                    />
                  </div>
                </div>

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
                          className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
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
                          className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
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
                      <div className="bg-black/50 rounded-lg p-4 overflow-auto max-h-[500px]">
                        <CharacterPreview
                          characters={characters}
                          config={config}
                          maxCharacters={256}
                          maxWidth={600}
                          maxHeight={400}
                          scale={3}
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
    </div>
  );
}
