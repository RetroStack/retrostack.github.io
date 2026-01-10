"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NeonText } from "@/components/effects/NeonText";
import { ImportStepIndicator } from "@/components/character-editor/import/ImportStepIndicator";
import { MetadataStep } from "@/components/character-editor/import/MetadataStep";
import { LibraryCardCompact } from "@/components/character-editor/library/LibraryCard";
import { DimensionPresetSelector } from "@/components/character-editor/selectors/DimensionPresetSelector";
import { CharacterCountPresetSelector } from "@/components/character-editor/selectors/CharacterCountPresetSelector";
import { useCharacterLibrary } from "@/hooks/character-editor/useCharacterLibrary";
import { useEditorReturn } from "@/hooks/character-editor/useEditorReturn";
import {
  CharacterSetConfig,
  AnchorPoint,
  SerializedCharacterSet,
  createDefaultConfig,
  generateId,
} from "@/lib/character-editor/types";
import { deserializeCharacterSet } from "@/lib/character-editor/import/binary";
import { resizeCharacter } from "@/lib/character-editor/transforms";
import { getAnchorPositions, getAnchorPositionLabel } from "@/lib/character-editor/presets";

type SourceMode = "copy" | "new";
type WizardStep = 1 | 2 | 3 | 4;

// Get anchor positions from centralized presets
const ANCHOR_POSITIONS = getAnchorPositions();

/**
 * Add view for the Character ROM Editor - Multi-step wizard to create new character set
 */
export function AddView() {
  const router = useRouter();
  const { characterSets, save, loading } = useCharacterLibrary();
  const { backUrl, backLabel } = useEditorReturn();

  // Current step
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1: Metadata state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [system, setSystem] = useState("");
  const [chip, setChip] = useState("");
  const [locale, setLocale] = useState("");
  const [source, setSource] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Step 2: Source mode
  const [sourceMode, setSourceMode] = useState<SourceMode>("new");

  // Step 3a: Selected source for copy
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Step 3b / Step 4a: Dimensions and count
  const [config, setConfig] = useState<CharacterSetConfig>(createDefaultConfig());
  const [characterCount, setCharacterCount] = useState(256);
  const [anchor, setAnchor] = useState<AnchorPoint>("tl");

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get selected source set
  const selectedSource = useMemo(() => {
    if (!selectedSourceId) return null;
    return characterSets.find((s) => s.metadata.id === selectedSourceId) || null;
  }, [characterSets, selectedSourceId]);

  // Filter character sets for selection
  const filteredSets = useMemo(() => {
    if (!searchQuery.trim()) return characterSets;
    const query = searchQuery.toLowerCase();
    return characterSets.filter(
      (set) =>
        set.metadata.name.toLowerCase().includes(query) ||
        set.metadata.description.toLowerCase().includes(query)
    );
  }, [characterSets, searchQuery]);

  // Check if dimensions differ from source
  const dimensionsDiffer = useMemo(() => {
    if (!selectedSource) return false;
    return (
      config.width !== selectedSource.config.width ||
      config.height !== selectedSource.config.height
    );
  }, [selectedSource, config.width, config.height]);

  // Step labels
  const stepLabels = useMemo(() => {
    if (sourceMode === "copy") {
      return ["Metadata", "Source", "Select Set", "Dimensions"];
    }
    return ["Metadata", "Source", "Dimensions"];
  }, [sourceMode]);

  const totalSteps = sourceMode === "copy" ? 4 : 3;

  // Step validation
  const canProceedStep1 = name.trim().length > 0;
  const canProceedStep3 = sourceMode === "new" || selectedSourceId !== null;
  const canSave = canProceedStep1 && canProceedStep3;

  // Handlers
  const handleNext = useCallback(() => {
    if (step < totalSteps) {
      setStep((step + 1) as WizardStep);
    }
  }, [step, totalSteps]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((step - 1) as WizardStep);
    }
  }, [step]);

  const handleSourceModeChange = useCallback((mode: SourceMode) => {
    setSourceMode(mode);
    // Reset source selection when switching modes
    if (mode === "new") {
      setSelectedSourceId(null);
    }
  }, []);

  const handleSelectSource = useCallback((set: SerializedCharacterSet) => {
    setSelectedSourceId(set.metadata.id);
    // Set default dimensions from source
    setConfig((prev) => ({
      ...prev,
      width: set.config.width,
      height: set.config.height,
    }));
  }, []);

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

  const handleCharacterCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= 512) {
        setCharacterCount(value);
      }
    },
    []
  );

  const handlePresetClick = useCallback((width: number, height: number) => {
    setConfig((prev) => ({ ...prev, width, height }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setSaveError("Please provide a name for the character set");
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const now = Date.now();
      const id = generateId();

      let characters;

      if (sourceMode === "copy" && selectedSource) {
        // Copy from existing set
        const sourceSet = deserializeCharacterSet(selectedSource);
        const sourceChars = sourceSet.characters;

        // Resize if dimensions differ
        if (dimensionsDiffer) {
          characters = sourceChars.map((char) =>
            resizeCharacter(char, config.width, config.height, anchor)
          );
        } else {
          characters = sourceChars;
        }
      } else {
        // Create empty characters
        characters = Array.from({ length: characterCount }, () => ({
          pixels: Array.from({ length: config.height }, () =>
            Array(config.width).fill(false)
          ),
        }));
      }

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
        characters,
      };

      await save(characterSet);
      router.push(`/tools/character-rom-editor/edit?id=${id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save character set");
    } finally {
      setSaving(false);
    }
  }, [
    name,
    description,
    source,
    manufacturer,
    system,
    chip,
    locale,
    tags,
    config,
    sourceMode,
    selectedSource,
    characterCount,
    dimensionsDiffer,
    anchor,
    save,
    router,
  ]);

  return (
    <div className="min-h-screen flex flex-col safe-top">
      <Header />

      <main className="flex-1 bg-retro-dark pt-24 pb-12">
        <Container size="default">
          {/* Page header */}
          <div className="mb-6">
            <Link
              href={backUrl}
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
              {backLabel}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-display">
              <NeonText color="pink">Create Character Set</NeonText>
            </h1>
          </div>

          {/* Step indicator */}
          <ImportStepIndicator
            currentStep={step}
            totalSteps={totalSteps}
            labels={stepLabels}
          />

          {/* Step content */}
          <div className="max-w-2xl mx-auto">
            {/* Step 1: Metadata */}
            {step === 1 && (
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
                  tags={tags}
                  onTagsChange={setTags}
                  autoFocusName
                />

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

            {/* Step 2: Source Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-medium text-gray-200 mb-2">
                    Character Source
                  </h2>
                  <p className="text-sm text-gray-400">
                    Choose how to create your character set
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Create New */}
                  <button
                    onClick={() => handleSourceModeChange("new")}
                    className={`
                      p-6 rounded-lg border-2 text-left transition-all
                      ${
                        sourceMode === "new"
                          ? "border-retro-pink bg-retro-pink/10"
                          : "border-retro-grid/50 hover:border-retro-grid"
                      }
                    `}
                  >
                    <div className="w-10 h-10 rounded-full bg-retro-purple/30 flex items-center justify-center mb-3">
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-200 mb-1">
                      Create New
                    </h3>
                    <p className="text-xs text-gray-500">
                      Start with empty characters
                    </p>
                  </button>

                  {/* Copy from Existing */}
                  <button
                    onClick={() => handleSourceModeChange("copy")}
                    className={`
                      p-6 rounded-lg border-2 text-left transition-all
                      ${
                        sourceMode === "copy"
                          ? "border-retro-cyan bg-retro-cyan/10"
                          : "border-retro-grid/50 hover:border-retro-grid"
                      }
                    `}
                  >
                    <div className="w-10 h-10 rounded-full bg-retro-cyan/20 flex items-center justify-center mb-3">
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
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-200 mb-1">
                      Copy from Existing
                    </h3>
                    <p className="text-xs text-gray-500">
                      Use another set as starting point
                    </p>
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button onClick={handleBack} variant="ghost">
                    Back
                  </Button>
                  <Button onClick={handleNext} variant="cyan">
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3a: Select Source Set (Copy mode) */}
            {step === 3 && sourceMode === "copy" && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-medium text-gray-200 mb-2">
                    Select Source
                  </h2>
                  <p className="text-sm text-gray-400">
                    Choose a character set to copy from
                  </p>
                </div>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search character sets..."
                    className="w-full px-3 py-2 pl-10 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Character set list */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">
                      Loading...
                    </div>
                  ) : filteredSets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No character sets found
                    </div>
                  ) : (
                    filteredSets.map((set) => (
                      <LibraryCardCompact
                        key={set.metadata.id}
                        characterSet={set}
                        selected={selectedSourceId === set.metadata.id}
                        onClick={() => handleSelectSource(set)}
                      />
                    ))
                  )}
                </div>

                {/* Selected info */}
                {selectedSource && (
                  <div className="text-xs text-gray-500 text-center">
                    Selected: {selectedSource.metadata.name} ({selectedSource.config.width}x{selectedSource.config.height})
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button onClick={handleBack} variant="ghost">
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedStep3}
                    variant="cyan"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3b: Dimensions (New mode) OR Step 4a: Dimensions (Copy mode) */}
            {((step === 3 && sourceMode === "new") || (step === 4 && sourceMode === "copy")) && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-medium text-gray-200 mb-2">
                    {sourceMode === "copy" ? "Target Dimensions" : "Character Dimensions"}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {sourceMode === "copy"
                      ? "Set the dimensions for the new character set"
                      : "Configure the size of each character"}
                  </p>
                </div>

                <div className="card-retro p-6 space-y-6">
                  {/* Source dimensions info (copy mode) */}
                  {sourceMode === "copy" && selectedSource && (
                    <div className="text-sm text-gray-400 text-center pb-4 border-b border-retro-grid/30">
                      Source dimensions: {selectedSource.config.width}x{selectedSource.config.height}
                    </div>
                  )}

                  {/* Dimensions */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3">
                      Dimensions
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
                      <DimensionPresetSelector
                        currentWidth={config.width}
                        currentHeight={config.height}
                        onSelect={handlePresetClick}
                      />
                    </div>
                  </div>

                  {/* Anchor point (only show if dimensions differ in copy mode) */}
                  {sourceMode === "copy" && dimensionsDiffer && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-2">
                        Anchor Position
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Select where to anchor content when resizing
                      </p>
                      <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
                        {ANCHOR_POSITIONS.map((pos) => {
                          const isSelected = anchor === pos;
                          return (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => setAnchor(pos)}
                              className={`
                                w-10 h-10 rounded border-2 transition-all
                                flex items-center justify-center
                                ${isSelected
                                  ? "border-retro-cyan bg-retro-cyan/20"
                                  : "border-retro-grid/50 bg-retro-dark hover:border-retro-grid"
                                }
                              `}
                              title={getAnchorPositionLabel(pos)}
                            >
                              <div
                                className={`
                                  w-3 h-3 rounded-sm transition-colors
                                  ${isSelected ? "bg-retro-cyan" : "bg-gray-600"}
                                `}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Characters will be resized from {selectedSource?.config.width}x{selectedSource?.config.height} to {config.width}x{config.height}
                      </p>
                    </div>
                  )}

                  {/* Character count (only for new mode) */}
                  {sourceMode === "new" && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-3">
                        Number of Characters
                      </h3>
                      <div className="max-w-xs">
                        <input
                          type="number"
                          id="characterCount"
                          min={1}
                          max={512}
                          value={characterCount}
                          onChange={handleCharacterCountChange}
                          className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan mb-3"
                        />
                        <CharacterCountPresetSelector
                          currentCount={characterCount}
                          onSelect={(count) => setCharacterCount(count)}
                        />
                      </div>
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
                  <Button
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    variant="pink"
                  >
                    {saving ? "Creating..." : "Create & Edit"}
                  </Button>
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
