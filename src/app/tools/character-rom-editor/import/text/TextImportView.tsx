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
  CharacterPreview,
  ImportStepIndicator,
  MetadataStep,
  DimensionPresetSelector,
  PaddingDirectionSelector,
  BitDirectionSelector,
} from "@/components/character-editor";
import { useCharacterLibrary } from "@/hooks/character-editor";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import {
  TextImportOptions,
  getDefaultTextImportOptions,
  parseTextToCharacters,
  getParseResultSummary,
} from "@/lib/character-editor/textImport";
import { CharacterSetConfig, Character, generateId } from "@/lib/character-editor/types";

type WizardStep = 1 | 2 | 3;

const STEP_LABELS = ["Configure", "Metadata", "Save"];

/**
 * Text import view - Import characters from pasted byte data
 */
export function TextImportView() {
  const router = useRouter();
  const { save } = useCharacterLibrary();
  const { ref: previewContainerRef, size: previewSize } = useResizeObserver<HTMLDivElement>();

  // Current step
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1: Text input state
  const [textInput, setTextInput] = useState("");

  // Import options
  const [options, setOptions] = useState<TextImportOptions>(getDefaultTextImportOptions());

  // Step 2: Metadata state
  const [name, setName] = useState("Imported Character Set");
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [system, setSystem] = useState("");
  const [locale, setLocale] = useState("");
  const [source, setSource] = useState("");

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Parse result
  const parseResult = useMemo(() => {
    if (!textInput.trim()) return null;
    return parseTextToCharacters(textInput, options);
  }, [textInput, options]);

  // Characters from parse result
  const characters: Character[] = parseResult?.characters || [];

  // Config from parse result or options
  const config: CharacterSetConfig = parseResult?.config || {
    width: options.charWidth,
    height: options.charHeight,
    padding: options.padding,
    bitDirection: options.bitDirection,
  };

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
  const hasText = textInput.trim().length > 0;
  const hasCharacters = parseResult && parseResult.characters.length > 0;
  const canProceedStep1 = hasCharacters;
  const canProceedStep2 = name.trim().length > 0;
  const canSave = canProceedStep1 && canProceedStep2;

  // Update option handlers
  const updateOption = useCallback(<K extends keyof TextImportOptions>(key: K, value: TextImportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
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
            chip: "",
            locale: locale.trim(),
            createdAt: now,
            updatedAt: now,
            isBuiltIn: false,
          },
          config: parseResult.config,
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
    [parseResult, name, description, source, manufacturer, system, locale, save, router]
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
              <NeonText color="violet">Import from Code</NeonText>
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
                <div className="text-center mb-6">
                  <h2 className="text-lg font-medium text-gray-200 mb-2">
                    Paste Byte Data
                  </h2>
                  <p className="text-sm text-gray-400">
                    Paste byte arrays from C, JavaScript, or Assembly code
                  </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
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
                        className="w-full h-40 px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-retro-violet/50 resize-none"
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
                        <PaddingDirectionSelector
                          value={options.padding}
                          onChange={(padding) => updateOption("padding", padding)}
                        />
                      </div>

                      {/* Bit direction */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Bit Direction</label>
                        <BitDirectionSelector
                          value={options.bitDirection}
                          onChange={(bitDirection) => updateOption("bitDirection", bitDirection)}
                        />
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        <strong>Supported formats:</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                        <li>
                          Hex: <code className="text-retro-violet">0x00</code>, <code className="text-retro-violet">$FF</code>
                        </li>
                        <li>
                          Decimal: <code className="text-retro-violet">0</code>, <code className="text-retro-violet">255</code>
                        </li>
                        <li>
                          Binary: <code className="text-retro-violet">0b00000000</code>
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
                            {previewDimensions.scale > 1 && ` - ${previewDimensions.scale}x`}
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
                            characterBorderColor="rgba(139, 92, 246, 0.4)"
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
