"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NeonText } from "@/components/effects/NeonText";
import { CharacterPreview } from "@/components/character-editor";
import { useCharacterLibrary } from "@/hooks/character-editor";
import {
  CharacterSet,
  PaddingDirection,
  BitDirection,
  createDownloadBlob,
  downloadBlob,
  getSuggestedFilename,
  formatFileSize,
  bytesPerCharacter,
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
  getHexPreview,
  getBitLayoutVisualization,
} from "@/lib/character-editor";

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

  // Get file extension based on format
  const getExtension = useCallback(() => {
    const formatInfo = EXPORT_FORMATS.find((f) => f.id === format);
    return formatInfo?.extension || ".bin";
  }, [format]);

  // Update filename extension when format changes
  useEffect(() => {
    if (filename) {
      // Remove existing extension and add new one
      const baseName = filename.replace(/\.(bin|h|asm|inc|png)$/i, "");
      let newExtension = EXPORT_FORMATS.find((f) => f.id === format)?.extension || ".bin";
      // For reference sheet, add -reference suffix
      if (format === "reference-sheet") {
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
            {/* Left: Preview and info */}
            <div className="lg:col-span-1">
              <h2 className="text-sm font-medium text-gray-300 mb-4">Preview</h2>
              <div className="card-retro p-4">
                {characterSet && (
                  <div className="bg-black/50 rounded-lg p-4 overflow-auto max-h-[200px]">
                    <CharacterPreview
                      characters={characterSet.characters}
                      config={characterSet.config}
                      maxCharacters={128}
                      maxWidth={220}
                      maxHeight={180}
                    />
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span>{characterSet?.characters.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>
                      {characterSet?.config.width}x{characterSet?.config.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Binary size:</span>
                    <span>{formatFileSize(exportSize)}</span>
                  </div>
                </div>
              </div>

              {/* Hex Preview */}
              {format === "binary" && hexPreview && (
                <div className="mt-4">
                  <h3 className="text-xs font-medium text-gray-400 mb-2">
                    First 16 bytes (hex)
                  </h3>
                  <div className="bg-black/50 rounded p-3 font-mono text-xs text-retro-cyan overflow-x-auto">
                    {hexPreview}
                  </div>
                </div>
              )}

              {/* Bit Layout Visualization */}
              {format === "binary" && bitLayout && (
                <div className="mt-4">
                  <h3 className="text-xs font-medium text-gray-400 mb-2">
                    Bit layout (first row, char 0)
                  </h3>
                  <div className="bg-black/50 rounded p-3 font-mono text-[10px] space-y-1">
                    <div className="text-gray-500">
                      Bits: <span className="text-retro-pink">{bitLayout.bits}</span>
                    </div>
                    <div className="text-gray-500">
                      Type: <span className="text-retro-cyan">{bitLayout.padding}</span>
                    </div>
                    <div className="text-gray-500 mt-2 text-[9px]">
                      D = Data, P = Padding
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[9px] text-gray-500">
                      <span className="flex items-center gap-1">
                        {bitDirection === "ltr" ? (
                          <>
                            MSB
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            LSB
                          </>
                        ) : (
                          <>
                            LSB
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            MSB
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Center: Format selection */}
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

            {/* Right: Format options */}
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPadding("right")}
                          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                            padding === "right"
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }`}
                        >
                          Right
                        </button>
                        <button
                          onClick={() => setPadding("left")}
                          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                            padding === "left"
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }`}
                        >
                          Left
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-2">
                        Bit Direction
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBitDirection("ltr")}
                          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                            bitDirection === "ltr"
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }`}
                        >
                          MSB First
                        </button>
                        <button
                          onClick={() => setBitDirection("rtl")}
                          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                            bitDirection === "rtl"
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }`}
                        >
                          LSB First
                        </button>
                      </div>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Foreground
                        </label>
                        <input
                          type="color"
                          value={pngOptions.foregroundColor}
                          onChange={(e) =>
                            setPngOptions({ ...pngOptions, foregroundColor: e.target.value })
                          }
                          className="w-full h-8 bg-retro-navy/50 border border-retro-grid/50 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Background
                        </label>
                        <input
                          type="color"
                          value={pngOptions.backgroundColor}
                          onChange={(e) =>
                            setPngOptions({ ...pngOptions, backgroundColor: e.target.value })
                          }
                          className="w-full h-8 bg-retro-navy/50 border border-retro-grid/50 rounded cursor-pointer"
                        />
                      </div>
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
                {format === "reference-sheet" && (
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

                    <div className="grid grid-cols-2 gap-3">
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
                          <option value={2}>2x</option>
                          <option value={3}>3x</option>
                          <option value={4}>4x</option>
                          <option value={5}>5x</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Foreground
                        </label>
                        <input
                          type="color"
                          value={referenceSheetOptions.foregroundColor}
                          onChange={(e) =>
                            setReferenceSheetOptions({ ...referenceSheetOptions, foregroundColor: e.target.value })
                          }
                          className="w-full h-8 bg-retro-navy/50 border border-retro-grid/50 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Background
                        </label>
                        <input
                          type="color"
                          value={referenceSheetOptions.backgroundColor}
                          onChange={(e) =>
                            setReferenceSheetOptions({ ...referenceSheetOptions, backgroundColor: e.target.value })
                          }
                          className="w-full h-8 bg-retro-navy/50 border border-retro-grid/50 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Show Labels
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={referenceSheetOptions.showTitle}
                            onChange={(e) =>
                              setReferenceSheetOptions({ ...referenceSheetOptions, showTitle: e.target.checked })
                            }
                            className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                          />
                          Show title header
                        </label>
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
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={referenceSheetOptions.showAscii}
                            onChange={(e) =>
                              setReferenceSheetOptions({ ...referenceSheetOptions, showAscii: e.target.checked })
                            }
                            className="rounded border-retro-grid/50 bg-retro-navy/50 text-retro-cyan focus:ring-retro-cyan/50"
                          />
                          ASCII characters
                        </label>
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
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
