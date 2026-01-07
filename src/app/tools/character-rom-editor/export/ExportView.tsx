"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NeonText } from "@/components/effects/NeonText";
import {
  CharacterPreview,
  ColorPresetSelector,
  PaddingDirectionSelector,
  BitDirectionSelector,
} from "@/components/character-editor";
import { CustomColors } from "@/lib/character-editor/colorPresets";
import { useCharacterLibrary } from "@/hooks/character-editor";
import { CharacterSet, PaddingDirection, BitDirection, bytesPerCharacter } from "@/lib/character-editor/types";
import { createDownloadBlob, downloadBlob } from "@/lib/character-editor/binary";
import { getSuggestedFilename, formatFileSize } from "@/lib/character-editor/utils";
import {
  EXPORT_FORMATS,
  ExportFormat,
  CHeaderOptions,
  AssemblyOptions,
  PngOptions,
  ReferenceSheetOptions,
  getDefaultCHeaderOptions,
  getDefaultAssemblyOptions,
  getDefaultPngOptions,
  getDefaultReferenceSheetOptions,
  exportToCHeader,
  exportToAssembly,
  exportToPng,
  exportToReferenceSheet,
  exportToReferenceSheetPdf,
  getHexPreview,
  getBitLayoutVisualization,
} from "@/lib/character-editor/exports";

/**
 * Export view for the Character ROM Editor
 */
export function ExportView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { getById } = useCharacterLibrary();

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [characterSet, setCharacterSet] = useState<CharacterSet | null>(null);
  const [exporting, setExporting] = useState(false);

  // Export format
  const [format, setFormat] = useState<ExportFormat>("binary");

  // Binary export settings
  const [filename, setFilename] = useState("");
  const [padding, setPadding] = useState<PaddingDirection>("right");
  const [bitDirection, setBitDirection] = useState<BitDirection>("ltr");

  // C Header options
  const [cHeaderOptions, setCHeaderOptions] = useState<CHeaderOptions>(
    getDefaultCHeaderOptions("")
  );

  // Assembly options
  const [assemblyOptions, setAssemblyOptions] = useState<AssemblyOptions>(
    getDefaultAssemblyOptions("")
  );

  // PNG options
  const [pngOptions, setPngOptions] = useState<PngOptions>(getDefaultPngOptions());

  // Reference sheet options
  const [referenceSheetOptions, setReferenceSheetOptions] = useState<ReferenceSheetOptions>(
    getDefaultReferenceSheetOptions("")
  );

  // Load character set
  useEffect(() => {
    async function loadCharacterSet() {
      if (!id) {
        setError("No character set ID provided");
        setLoading(false);
        return;
      }

      try {
        const loaded = await getById(id);
        if (!loaded) {
          setError("Character set not found");
        } else {
          setCharacterSet(loaded);
          setFilename(getSuggestedFilename(loaded.metadata.name));
          setPadding(loaded.config.padding);
          setBitDirection(loaded.config.bitDirection);
          setCHeaderOptions(getDefaultCHeaderOptions(loaded.metadata.name));
          setAssemblyOptions(getDefaultAssemblyOptions(loaded.metadata.name));
          setReferenceSheetOptions(getDefaultReferenceSheetOptions(loaded.metadata.name));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load character set");
      } finally {
        setLoading(false);
      }
    }

    loadCharacterSet();
  }, [id, getById]);

  // Calculate export size
  const exportSize = useMemo(() => {
    if (!characterSet) return 0;
    return characterSet.characters.length * bytesPerCharacter(characterSet.config);
  }, [characterSet]);

  // Get hex preview
  const hexPreview = useMemo(() => {
    if (!characterSet || characterSet.characters.length === 0) return "";
    const config = { ...characterSet.config, padding, bitDirection };
    return getHexPreview(characterSet.characters, config, 16);
  }, [characterSet, padding, bitDirection]);

  // Get bit layout visualization for first character
  const bitLayout = useMemo(() => {
    if (!characterSet || characterSet.characters.length === 0) return null;
    const config = { ...characterSet.config, padding, bitDirection };
    return getBitLayoutVisualization(characterSet.characters[0], config, 0);
  }, [characterSet, padding, bitDirection]);

  // Get C header preview
  const cHeaderPreview = useMemo(() => {
    if (!characterSet || characterSet.characters.length === 0) return "";
    const config = { ...characterSet.config, padding, bitDirection };
    return exportToCHeader(characterSet.characters, config, cHeaderOptions);
  }, [characterSet, padding, bitDirection, cHeaderOptions]);

  // Get assembly preview
  const assemblyPreview = useMemo(() => {
    if (!characterSet || characterSet.characters.length === 0) return "";
    const config = { ...characterSet.config, padding, bitDirection };
    return exportToAssembly(characterSet.characters, config, assemblyOptions);
  }, [characterSet, padding, bitDirection, assemblyOptions]);

  // Get file extension based on format
  const getExtension = useCallback(() => {
    const formatInfo = EXPORT_FORMATS.find((f) => f.id === format);
    return formatInfo?.extension || ".bin";
  }, [format]);

  // Update filename extension when format changes
  useEffect(() => {
    if (filename) {
      // Remove existing extension and add new one
      const baseName = filename.replace(/\.(bin|h|asm|inc|png|pdf)$/i, "");
      const newExtension = EXPORT_FORMATS.find((f) => f.id === format)?.extension || ".bin";
      // For reference sheet formats, add -reference suffix
      if (format === "reference-sheet" || format === "reference-sheet-pdf") {
        const cleanBase = baseName.replace(/-reference$/, "");
        setFilename(cleanBase + "-reference" + newExtension);
      } else {
        setFilename(baseName + newExtension);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!characterSet) return;

    setExporting(true);

    try {
      const exportConfig = {
        ...characterSet.config,
        padding,
        bitDirection,
      };

      let blob: Blob;
      let exportFilename = filename || "charset";

      switch (format) {
        case "binary": {
          blob = createDownloadBlob(
            characterSet.characters,
            characterSet.config,
            exportConfig
          );
          if (!exportFilename.endsWith(".bin")) {
            exportFilename += ".bin";
          }
          break;
        }

        case "c-header": {
          const content = exportToCHeader(
            characterSet.characters,
            exportConfig,
            cHeaderOptions
          );
          blob = new Blob([content], { type: "text/x-c" });
          if (!exportFilename.endsWith(".h")) {
            exportFilename += ".h";
          }
          break;
        }

        case "assembly": {
          const content = exportToAssembly(
            characterSet.characters,
            exportConfig,
            assemblyOptions
          );
          blob = new Blob([content], { type: "text/plain" });
          if (!exportFilename.endsWith(".asm") && !exportFilename.endsWith(".inc")) {
            exportFilename += ".asm";
          }
          break;
        }

        case "png": {
          blob = await exportToPng(characterSet.characters, characterSet.config, pngOptions);
          if (!exportFilename.endsWith(".png")) {
            exportFilename += ".png";
          }
          break;
        }

        case "reference-sheet": {
          blob = await exportToReferenceSheet(
            characterSet.characters,
            characterSet.config,
            referenceSheetOptions
          );
          if (!exportFilename.endsWith(".png")) {
            exportFilename += ".png";
          }
          break;
        }

        case "reference-sheet-pdf": {
          blob = await exportToReferenceSheetPdf(
            characterSet.characters,
            characterSet.config,
            referenceSheetOptions
          );
          if (!exportFilename.endsWith(".pdf")) {
            exportFilename += ".pdf";
          }
          break;
        }

        default:
          throw new Error(`Unknown export format: ${format}`);
      }

      downloadBlob(blob, exportFilename);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  }, [
    characterSet,
    format,
    filename,
    padding,
    bitDirection,
    cHeaderOptions,
    assemblyOptions,
    pngOptions,
    referenceSheetOptions,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading character set...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col safe-top">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-retro-dark">
          <div className="flex flex-col items-center gap-4 text-center">
            <svg
              className="w-16 h-16 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-lg font-medium text-red-400">{error}</h2>
            <Link
              href="/tools/character-rom-editor"
              className="text-sm text-retro-cyan hover:text-retro-pink transition-colors"
            >
              Back to Library
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col safe-top">
      <Header />

      <main className="flex-1 bg-retro-dark pt-24 pb-12">
        <Container>
          {/* Page header */}
          <div className="mb-8">
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
              <NeonText color="pink">Export Character ROM</NeonText>
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Export &quot;{characterSet?.metadata.name}&quot; in various formats
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Format selection */}
            <div className="lg:col-span-1">
              <h2 className="text-sm font-medium text-gray-300 mb-4">Format</h2>
              <div className="card-retro p-4 space-y-2">
                {EXPORT_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      format === f.id
                        ? "border-retro-cyan bg-retro-cyan/10"
                        : "border-retro-grid/30 hover:border-retro-grid/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          format === f.id ? "text-retro-cyan" : "text-gray-300"
                        }`}
                      >
                        {f.name}
                      </span>
                      <span className="text-xs text-gray-500">{f.extension}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{f.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Center: Format options */}
            <div className="lg:col-span-1">
              <h2 className="text-sm font-medium text-gray-300 mb-4">Options</h2>
              <div className="card-retro p-4 space-y-4">
                {/* Filename (common to all) */}
                <div>
                  <label
                    htmlFor="filename"
                    className="block text-xs font-medium text-gray-400 mb-1"
                  >
                    Filename
                  </label>
                  <input
                    type="text"
                    id="filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                    placeholder={`charset${getExtension()}`}
                  />
                </div>

                {/* Binary options */}
                {format === "binary" && (
                  <>
                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-2">
                        Bit Padding
                      </h3>
                      <PaddingDirectionSelector
                        value={padding}
                        onChange={setPadding}
                      />
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-2">
                        Bit Direction
                      </h3>
                      <BitDirectionSelector
                        value={bitDirection}
                        onChange={setBitDirection}
                      />
                    </div>
                  </>
                )}

                {/* C Header options */}
                {format === "c-header" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Array Name
                      </label>
                      <input
                        type="text"
                        value={cHeaderOptions.arrayName}
                        onChange={(e) =>
                          setCHeaderOptions({ ...cHeaderOptions, arrayName: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50 font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cHeaderOptions.includeGuards}
                          onChange={(e) =>
                            setCHeaderOptions({
                              ...cHeaderOptions,
                              includeGuards: e.target.checked,
                            })
                          }
                          className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                        />
                        Include guards (#ifndef)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cHeaderOptions.includeComments}
                          onChange={(e) =>
                            setCHeaderOptions({
                              ...cHeaderOptions,
                              includeComments: e.target.checked,
                            })
                          }
                          className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                        />
                        Include comments
                      </label>
                    </div>
                  </>
                )}

                {/* Assembly options */}
                {format === "assembly" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Label Name
                      </label>
                      <input
                        type="text"
                        value={assemblyOptions.labelName}
                        onChange={(e) =>
                          setAssemblyOptions({ ...assemblyOptions, labelName: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Directive Style
                      </label>
                      <select
                        value={assemblyOptions.directive}
                        onChange={(e) =>
                          setAssemblyOptions({
                            ...assemblyOptions,
                            directive: e.target.value as AssemblyOptions["directive"],
                          })
                        }
                        className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                      >
                        <option value=".byte">.byte (ca65, DASM)</option>
                        <option value="db">db (NASM, z80)</option>
                        <option value=".db">.db (ASM6)</option>
                        <option value="DC.B">DC.B (68000)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assemblyOptions.useHex}
                          onChange={(e) =>
                            setAssemblyOptions({ ...assemblyOptions, useHex: e.target.checked })
                          }
                          className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                        />
                        Use hex values ($FF)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assemblyOptions.includeComments}
                          onChange={(e) =>
                            setAssemblyOptions({
                              ...assemblyOptions,
                              includeComments: e.target.checked,
                            })
                          }
                          className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                        />
                        Include comments
                      </label>
                    </div>
                  </>
                )}

                {/* PNG options */}
                {format === "png" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Columns
                        </label>
                        <select
                          value={pngOptions.columns}
                          onChange={(e) =>
                            setPngOptions({ ...pngOptions, columns: parseInt(e.target.value) })
                          }
                          className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                        >
                          <option value={8}>8</option>
                          <option value={16}>16</option>
                          <option value={32}>32</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Scale
                        </label>
                        <select
                          value={pngOptions.scale}
                          onChange={(e) =>
                            setPngOptions({ ...pngOptions, scale: parseInt(e.target.value) })
                          }
                          className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                        >
                          <option value={1}>1x</option>
                          <option value={2}>2x</option>
                          <option value={4}>4x</option>
                          <option value={8}>8x</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Colors
                      </label>
                      <ColorPresetSelector
                        colors={{
                          foreground: pngOptions.foregroundColor,
                          background: pngOptions.backgroundColor,
                          gridColor: "#333333",
                        }}
                        onColorsChange={(colors: CustomColors) =>
                          setPngOptions({
                            ...pngOptions,
                            foregroundColor: colors.foreground,
                            backgroundColor: colors.background,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pngOptions.showGrid}
                          onChange={(e) =>
                            setPngOptions({ ...pngOptions, showGrid: e.target.checked })
                          }
                          className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                        />
                        Show grid lines
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pngOptions.transparent}
                          onChange={(e) =>
                            setPngOptions({ ...pngOptions, transparent: e.target.checked })
                          }
                          className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                        />
                        Transparent background
                      </label>
                    </div>
                  </>
                )}

                {/* Reference Sheet options */}
                {(format === "reference-sheet" || format === "reference-sheet-pdf") && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={referenceSheetOptions.title}
                        onChange={(e) =>
                          setReferenceSheetOptions({ ...referenceSheetOptions, title: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                        placeholder="Character Set Title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Layout
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReferenceSheetOptions({ ...referenceSheetOptions, layout: "grid" })}
                          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                            referenceSheetOptions.layout === "grid"
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }`}
                        >
                          Grid
                        </button>
                        <button
                          onClick={() => setReferenceSheetOptions({ ...referenceSheetOptions, layout: "table" })}
                          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                            referenceSheetOptions.layout === "table"
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }`}
                        >
                          Table
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {referenceSheetOptions.layout === "grid" && (
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Columns
                          </label>
                          <select
                            value={referenceSheetOptions.columns}
                            onChange={(e) =>
                              setReferenceSheetOptions({ ...referenceSheetOptions, columns: parseInt(e.target.value) })
                            }
                            className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                          >
                            <option value={8}>8</option>
                            <option value={16}>16</option>
                            <option value={32}>32</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Scale
                        </label>
                        <select
                          value={referenceSheetOptions.scale}
                          onChange={(e) =>
                            setReferenceSheetOptions({ ...referenceSheetOptions, scale: parseInt(e.target.value) })
                          }
                          className="w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50"
                        >
                          <option value={3}>3x</option>
                          <option value={4}>4x</option>
                          <option value={5}>5x</option>
                          <option value={6}>6x</option>
                          <option value={8}>8x</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Character Colors
                      </label>
                      <ColorPresetSelector
                        colors={{
                          foreground: referenceSheetOptions.foregroundColor,
                          background: referenceSheetOptions.backgroundColor,
                          gridColor: "#333333",
                        }}
                        onColorsChange={(colors: CustomColors) =>
                          setReferenceSheetOptions({
                            ...referenceSheetOptions,
                            foregroundColor: colors.foreground,
                            backgroundColor: colors.background,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Sheet Background
                      </label>
                      <div className="flex gap-2">
                        {[
                          { color: "#1a1a2e", label: "Dark" },
                          { color: "#0d1117", label: "GitHub" },
                          { color: "#1e1e1e", label: "VS Code" },
                          { color: "#282c34", label: "One Dark" },
                          { color: "#ffffff", label: "White" },
                          { color: "#f5f5f5", label: "Light" },
                        ].map((preset) => (
                          <button
                            key={preset.color}
                            onClick={() =>
                              setReferenceSheetOptions({
                                ...referenceSheetOptions,
                                sheetBackgroundColor: preset.color,
                              })
                            }
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              referenceSheetOptions.sheetBackgroundColor === preset.color
                                ? "border-retro-cyan scale-110"
                                : "border-retro-grid/50 hover:border-retro-grid"
                            }`}
                            style={{ backgroundColor: preset.color }}
                            title={preset.label}
                          />
                        ))}
                        <input
                          type="color"
                          value={referenceSheetOptions.sheetBackgroundColor}
                          onChange={(e) =>
                            setReferenceSheetOptions({
                              ...referenceSheetOptions,
                              sheetBackgroundColor: e.target.value,
                            })
                          }
                          className="w-8 h-8 rounded border border-retro-grid/50 cursor-pointer"
                          title="Custom color"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Show Labels
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={referenceSheetOptions.showTitle}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showTitle: e.target.checked })
                              }
                              className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                            />
                            Title header
                          </label>
                          <input
                            type="color"
                            value={referenceSheetOptions.titleColor}
                            onChange={(e) =>
                              setReferenceSheetOptions({ ...referenceSheetOptions, titleColor: e.target.value })
                            }
                            className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                            title="Title color"
                          />
                        </div>
                        {referenceSheetOptions.layout === "table" && (
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={referenceSheetOptions.showGroupLabel}
                                onChange={(e) =>
                                  setReferenceSheetOptions({ ...referenceSheetOptions, showGroupLabel: e.target.checked })
                                }
                                className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                              />
                              Group labels
                            </label>
                            <input
                              type="color"
                              value={referenceSheetOptions.groupLabelColor}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, groupLabelColor: e.target.value })
                              }
                              className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                              title="Group label color"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={referenceSheetOptions.showHex}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showHex: e.target.checked })
                              }
                              className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                            />
                            Hex codes ($00)
                          </label>
                          <input
                            type="color"
                            value={referenceSheetOptions.hexColor}
                            onChange={(e) =>
                              setReferenceSheetOptions({ ...referenceSheetOptions, hexColor: e.target.value })
                            }
                            className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                            title="Hex color"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={referenceSheetOptions.showDecimal}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showDecimal: e.target.checked })
                              }
                              className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                            />
                            Decimal codes
                          </label>
                          <input
                            type="color"
                            value={referenceSheetOptions.decimalColor}
                            onChange={(e) =>
                              setReferenceSheetOptions({ ...referenceSheetOptions, decimalColor: e.target.value })
                            }
                            className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                            title="Decimal color"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={referenceSheetOptions.showOctal}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showOctal: e.target.checked })
                              }
                              className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                            />
                            Octal codes (000)
                          </label>
                          <input
                            type="color"
                            value={referenceSheetOptions.octalColor}
                            onChange={(e) =>
                              setReferenceSheetOptions({ ...referenceSheetOptions, octalColor: e.target.value })
                            }
                            className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                            title="Octal color"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={referenceSheetOptions.showBinary}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showBinary: e.target.checked })
                              }
                              className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                            />
                            Binary codes (00000000)
                          </label>
                          <input
                            type="color"
                            value={referenceSheetOptions.binaryColor}
                            onChange={(e) =>
                              setReferenceSheetOptions({ ...referenceSheetOptions, binaryColor: e.target.value })
                            }
                            className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                            title="Binary color"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={referenceSheetOptions.showAscii}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showAscii: e.target.checked })
                              }
                              className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                            />
                            ASCII printable
                          </label>
                          <input
                            type="color"
                            value={referenceSheetOptions.asciiColor}
                            onChange={(e) =>
                              setReferenceSheetOptions({ ...referenceSheetOptions, asciiColor: e.target.value })
                            }
                            className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                            title="ASCII printable color"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={referenceSheetOptions.showNonPrintableAscii}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showNonPrintableAscii: e.target.checked })
                              }
                              className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                            />
                            ASCII non-printable
                          </label>
                          <input
                            type="color"
                            value={referenceSheetOptions.nonPrintableAsciiColor}
                            onChange={(e) =>
                              setReferenceSheetOptions({ ...referenceSheetOptions, nonPrintableAsciiColor: e.target.value })
                            }
                            className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                            title="Non-printable ASCII color"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Download button */}
                <div className="pt-4">
                  <Button
                    onClick={handleExport}
                    variant="pink"
                    className="w-full"
                    disabled={exporting}
                  >
                    {exporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Download {EXPORT_FORMATS.find((f) => f.id === format)?.name}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="lg:col-span-1">
              <h2 className="text-sm font-medium text-gray-300 mb-4">Preview</h2>
              <div className="card-retro p-4">
                {/* Binary format preview */}
                {format === "binary" && (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="bg-black/50 rounded p-3 font-mono text-xs text-retro-cyan max-h-[300px] overflow-hidden">
                        {hexPreview && (
                          <div className="break-all">
                            {hexPreview}
                            {exportSize > 16 && (
                              <>
                                {" "}...
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {exportSize > 16 && (
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent rounded-b pointer-events-none flex items-end justify-center pb-2">
                          <span className="text-[10px] text-gray-500 bg-black/60 px-2 py-0.5 rounded">
                            {formatFileSize(exportSize)} total
                          </span>
                        </div>
                      )}
                    </div>
                    {bitLayout && (
                      <div className="text-[10px] text-gray-500 space-y-1">
                        <div>Bits: <span className="text-retro-pink font-mono">{bitLayout.bits}</span></div>
                        <div>Layout: <span className="text-retro-cyan font-mono">{bitLayout.padding}</span></div>
                        <div className="text-[9px]">D = Data, P = Padding</div>
                      </div>
                    )}
                  </div>
                )}

                {/* C Header preview */}
                {format === "c-header" && cHeaderPreview && (
                  <div className="relative">
                    <div className="bg-black/50 rounded p-3 font-mono text-[10px] text-gray-300 max-h-[300px] overflow-hidden whitespace-pre leading-relaxed">
                      {cHeaderPreview.split("\n").slice(0, 25).join("\n")}
                    </div>
                    {cHeaderPreview.split("\n").length > 25 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent rounded-b pointer-events-none flex items-end justify-center pb-2">
                        <span className="text-[10px] text-gray-500 bg-black/60 px-2 py-0.5 rounded">
                          {cHeaderPreview.split("\n").length - 25} more lines
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Assembly preview */}
                {format === "assembly" && assemblyPreview && (
                  <div className="relative">
                    <div className="bg-black/50 rounded p-3 font-mono text-[10px] text-gray-300 max-h-[300px] overflow-hidden whitespace-pre leading-relaxed">
                      {assemblyPreview.split("\n").slice(0, 25).join("\n")}
                    </div>
                    {assemblyPreview.split("\n").length > 25 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent rounded-b pointer-events-none flex items-end justify-center pb-2">
                        <span className="text-[10px] text-gray-500 bg-black/60 px-2 py-0.5 rounded">
                          {assemblyPreview.split("\n").length - 25} more lines
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* PNG preview */}
                {format === "png" && characterSet && (
                  <div className="relative">
                    <div
                      className="bg-black/50 rounded-lg p-4 max-h-[300px] overflow-hidden flex items-center justify-center"
                      style={{ backgroundColor: pngOptions.transparent ? "#1a1a2e" : pngOptions.backgroundColor }}
                    >
                      <CharacterPreview
                        characters={characterSet.characters}
                        config={characterSet.config}
                        maxCharacters={128}
                        maxWidth={220}
                        maxHeight={250}
                        foregroundColor={pngOptions.foregroundColor}
                        backgroundColor={pngOptions.transparent ? "transparent" : pngOptions.backgroundColor}
                      />
                    </div>
                    {characterSet.characters.length > 128 && (
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent rounded-b pointer-events-none flex items-end justify-center pb-2">
                        <span className="text-[10px] text-gray-500 bg-black/60 px-2 py-0.5 rounded">
                          {characterSet.characters.length - 128} more characters
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reference Sheet preview */}
                {(format === "reference-sheet" || format === "reference-sheet-pdf") && characterSet && (
                  <div className="relative">
                    <div
                      className="rounded-lg p-3 max-h-[320px] overflow-hidden"
                      style={{ backgroundColor: referenceSheetOptions.sheetBackgroundColor }}
                    >
                      {/* Title */}
                      {referenceSheetOptions.showTitle && (
                        <div className="text-center mb-2">
                          <div
                            className="text-xs font-bold font-mono"
                            style={{ color: referenceSheetOptions.titleColor }}
                          >
                            {referenceSheetOptions.title || "Character Set"}
                          </div>
                          <div className="text-[8px] text-gray-500 font-mono">
                            {characterSet.characters.length} characters, {characterSet.config.width}x{characterSet.config.height} pixels
                          </div>
                        </div>
                      )}

                      {referenceSheetOptions.layout === "grid" ? (
                        /* Grid layout preview */
                        <div className="overflow-hidden">
                          {/* Column headers */}
                          <div className="flex ml-5">
                            {Array.from({ length: Math.min(referenceSheetOptions.columns, 8) }).map((_, i) => (
                              <div
                                key={i}
                                className="text-[8px] font-mono text-center"
                                style={{
                                  color: "#888888",
                                  width: `${characterSet.config.width * 2 + 8}px`
                                }}
                              >
                                {i.toString(16).toUpperCase()}
                              </div>
                            ))}
                            {referenceSheetOptions.columns > 8 && (
                              <div className="text-[8px] font-mono text-gray-600">...</div>
                            )}
                          </div>

                          {/* Character rows */}
                          {Array.from({ length: Math.min(Math.ceil(characterSet.characters.length / referenceSheetOptions.columns), 4) }).map((_, rowIdx) => (
                            <div key={rowIdx} className="flex items-start">
                              {/* Row header */}
                              <div
                                className="text-[8px] font-mono w-5 text-right pr-1 pt-1 shrink-0"
                                style={{ color: "#888888" }}
                              >
                                {(rowIdx * referenceSheetOptions.columns).toString(16).toUpperCase().padStart(2, "0")}_
                              </div>

                              {/* Character cells */}
                              {Array.from({ length: Math.min(referenceSheetOptions.columns, 8) }).map((_, colIdx) => {
                                const charIdx = rowIdx * referenceSheetOptions.columns + colIdx;
                                const char = characterSet.characters[charIdx];
                                if (!char) return null;

                                return (
                                  <div
                                    key={colIdx}
                                    className="flex flex-col items-center p-0.5"
                                    style={{ width: `${characterSet.config.width * 2 + 8}px` }}
                                  >
                                    {/* Character pixels */}
                                    <div
                                      className="border border-gray-700"
                                      style={{
                                        width: `${characterSet.config.width * 2}px`,
                                        height: `${characterSet.config.height * 2}px`,
                                        backgroundColor: referenceSheetOptions.backgroundColor,
                                      }}
                                    >
                                      {char.pixels.map((row, y) => (
                                        <div key={y} className="flex">
                                          {row.map((pixel, x) => (
                                            <div
                                              key={x}
                                              style={{
                                                width: "2px",
                                                height: "2px",
                                                backgroundColor: pixel
                                                  ? referenceSheetOptions.foregroundColor
                                                  : referenceSheetOptions.backgroundColor,
                                              }}
                                            />
                                          ))}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Labels */}
                                    <div className="text-center leading-tight mt-0.5">
                                      {referenceSheetOptions.showHex && (
                                        <div className="text-[6px] font-mono" style={{ color: referenceSheetOptions.hexColor }}>
                                          ${charIdx.toString(16).toUpperCase().padStart(2, "0")}
                                        </div>
                                      )}
                                      {referenceSheetOptions.showDecimal && (
                                        <div className="text-[6px] font-mono" style={{ color: referenceSheetOptions.decimalColor }}>
                                          {charIdx}
                                        </div>
                                      )}
                                      {referenceSheetOptions.showOctal && (
                                        <div className="text-[6px] font-mono" style={{ color: referenceSheetOptions.octalColor }}>
                                          {charIdx.toString(8).padStart(3, "0")}
                                        </div>
                                      )}
                                      {referenceSheetOptions.showBinary && (
                                        <div className="text-[5px] font-mono" style={{ color: referenceSheetOptions.binaryColor }}>
                                          {charIdx.toString(2).padStart(8, "0")}
                                        </div>
                                      )}
                                      {referenceSheetOptions.showAscii && charIdx >= 32 && charIdx <= 126 && (
                                        <div
                                          className="text-[7px] font-mono"
                                          style={{ color: referenceSheetOptions.asciiColor }}
                                        >
                                          {String.fromCharCode(charIdx)}
                                        </div>
                                      )}
                                      {referenceSheetOptions.showNonPrintableAscii && (charIdx < 32 || charIdx === 127) && (
                                        <div
                                          className="text-[5px] font-mono"
                                          style={{ color: referenceSheetOptions.nonPrintableAsciiColor }}
                                        >
                                          {["NUL","SOH","STX","ETX","EOT","ENQ","ACK","BEL","BS","TAB","LF","VT","FF","CR","SO","SI","DLE","DC1","DC2","DC3","DC4","NAK","SYN","ETB","CAN","EM","SUB","ESC","FS","GS","RS","US"][charIdx] || (charIdx === 127 ? "DEL" : "")}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {referenceSheetOptions.columns > 8 && (
                                <div className="text-[8px] font-mono text-gray-600 pt-2">...</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Table layout preview */
                        <div className="overflow-hidden">
                          {/* Group label */}
                          {referenceSheetOptions.showGroupLabel && (
                            <div
                              className="text-[8px] font-mono font-bold text-center mb-1"
                              style={{ color: referenceSheetOptions.groupLabelColor }}
                            >
                              Control
                            </div>
                          )}

                          {/* Table header */}
                          <div className="flex gap-3 text-[7px] font-mono font-bold border-b border-gray-600 pb-1 mb-1" style={{ color: "#888888" }}>
                            <div className="w-5 text-center">Char</div>
                            {referenceSheetOptions.showDecimal && <div className="w-7 text-center">Dec</div>}
                            {referenceSheetOptions.showBinary && <div className="w-14 text-center">Binary</div>}
                            {referenceSheetOptions.showOctal && <div className="w-7 text-center">Oct</div>}
                            {referenceSheetOptions.showHex && <div className="w-6 text-center">Hex</div>}
                            {(referenceSheetOptions.showAscii || referenceSheetOptions.showNonPrintableAscii) && <div className="w-8 text-center">ASCII</div>}
                          </div>

                          {/* Table rows */}
                          {Array.from({ length: Math.min(characterSet.characters.length, 8) }).map((_, charIdx) => {
                            const char = characterSet.characters[charIdx];
                            if (!char) return null;
                            const isPrintable = charIdx >= 32 && charIdx <= 126;

                            return (
                              <div key={charIdx} className="flex gap-3 items-center text-[6px] font-mono py-0.5">
                                {/* Character graphic */}
                                <div className="w-5 flex justify-center">
                                  <div
                                    style={{
                                      width: `${characterSet.config.width * 2}px`,
                                      height: `${characterSet.config.height * 2}px`,
                                      backgroundColor: referenceSheetOptions.backgroundColor,
                                    }}
                                  >
                                    {char.pixels.map((row, y) => (
                                      <div key={y} className="flex">
                                        {row.map((pixel, x) => (
                                          <div
                                            key={x}
                                            style={{
                                              width: "2px",
                                              height: "2px",
                                              backgroundColor: pixel
                                                ? referenceSheetOptions.foregroundColor
                                                : referenceSheetOptions.backgroundColor,
                                            }}
                                          />
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {referenceSheetOptions.showDecimal && <div className="w-7 text-center" style={{ color: referenceSheetOptions.decimalColor }}>{charIdx}</div>}
                                {referenceSheetOptions.showBinary && <div className="w-14 text-center text-[5px]" style={{ color: referenceSheetOptions.binaryColor }}>{charIdx.toString(2).padStart(8, "0")}</div>}
                                {referenceSheetOptions.showOctal && <div className="w-7 text-center" style={{ color: referenceSheetOptions.octalColor }}>{charIdx.toString(8).padStart(3, "0")}</div>}
                                {referenceSheetOptions.showHex && <div className="w-6 text-center" style={{ color: referenceSheetOptions.hexColor }}>{charIdx.toString(16).toUpperCase().padStart(2, "0")}</div>}
                                {(referenceSheetOptions.showAscii || referenceSheetOptions.showNonPrintableAscii) && (
                                  <div className="w-8 text-center" style={{ color: isPrintable ? referenceSheetOptions.asciiColor : referenceSheetOptions.nonPrintableAsciiColor }}>
                                    {isPrintable && referenceSheetOptions.showAscii
                                      ? String.fromCharCode(charIdx)
                                      : (!isPrintable && referenceSheetOptions.showNonPrintableAscii
                                        ? (["NUL","SOH","STX","ETX","EOT","ENQ","ACK","BEL","BS","TAB","LF","VT","FF","CR","SO","SI","DLE","DC1","DC2","DC3","DC4","NAK","SYN","ETB","CAN","EM","SUB","ESC","FS","GS","RS","US"][charIdx] || (charIdx === 127 ? "DEL" : ""))
                                        : "")}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Clipping indicator */}
                    {(referenceSheetOptions.layout === "grid"
                      ? (characterSet.characters.length > referenceSheetOptions.columns * 4 || referenceSheetOptions.columns > 8)
                      : characterSet.characters.length > 8
                    ) && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-10 rounded-b pointer-events-none flex items-end justify-center pb-2"
                        style={{
                          background: `linear-gradient(to top, ${referenceSheetOptions.sheetBackgroundColor}, transparent)`
                        }}
                      >
                        <span className="text-[10px] text-gray-500 bg-black/60 px-2 py-0.5 rounded">
                          {referenceSheetOptions.layout === "grid"
                            ? `${Math.ceil(characterSet.characters.length / referenceSheetOptions.columns)} rows × ${referenceSheetOptions.columns} columns`
                            : `${characterSet.characters.length} rows total`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* File info */}
                <div className="mt-4 pt-4 border-t border-retro-grid/30 text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span>{characterSet?.characters.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span>{characterSet?.config.width}x{characterSet?.config.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File size:</span>
                    <span>{formatFileSize(exportSize)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
