"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import { NeonText } from "@/components/effects/NeonText";
import { CharacterPreview } from "@/components/character-editor/character/CharacterPreview";
import { PixelGrid } from "@/components/character-editor/editor/PixelGrid";
import { ColorPresetSelector } from "@/components/character-editor/selectors/ColorPresetSelector";
import { PaddingDirectionSelector } from "@/components/character-editor/selectors/PaddingDirectionSelector";
import { BitDirectionSelector } from "@/components/character-editor/selectors/BitDirectionSelector";
import { BinarySystemSelector } from "@/components/character-editor/selectors/BinarySystemSelector";
import { BloomEffectPanel, BloomEffectSettings } from "@/components/character-editor/editor/BloomEffectPanel";
import { CustomColors, getActiveColors } from "@/lib/character-editor/data/colorPresets";
import { useCharacterLibrary } from "@/hooks/character-editor/useCharacterLibrary";
import { useEditorReturn } from "@/hooks/character-editor/useEditorReturn";
import { CharacterSet, PaddingDirection, BitDirection, bytesPerCharacter } from "@/lib/character-editor/types";
import { createDownloadBlob, downloadBlob } from "@/lib/character-editor/import/binary";
import { getSuggestedFilename, formatFileSize } from "@/lib/character-editor/utils";
import {
  EXPORT_FORMATS,
  ExportFormat,
  CodeOutputFormat,
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
  getHexPreviewWithBytes,
} from "@/lib/character-editor/exports";

/**
 * Calculate relative luminance of a hex color
 * Returns a value between 0 (dark) and 1 (bright)
 */
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Check if a color is considered "bright" (light background)
 */
function isBrightColor(hexColor: string): boolean {
  return getLuminance(hexColor) > 0.5;
}

/** Dark label colors for bright backgrounds */
const DARK_LABEL_COLORS = {
  titleColor: "#000000",
  groupLabelColor: "#000000",
  hexColor: "#444444",
  decimalColor: "#444444",
  octalColor: "#444444",
  binaryColor: "#444444",
  asciiColor: "#000000",
  nonPrintableAsciiColor: "#666666",
};

/** Light label colors for dark backgrounds */
const LIGHT_LABEL_COLORS = {
  titleColor: "#ffffff",
  groupLabelColor: "#ffffff",
  hexColor: "#888888",
  decimalColor: "#888888",
  octalColor: "#888888",
  binaryColor: "#888888",
  asciiColor: "#ffffff",
  nonPrintableAsciiColor: "#666666",
};

/**
 * Export view for the Character ROM Editor
 */
export function ExportView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { getById } = useCharacterLibrary();
  const { backUrl, backLabel } = useEditorReturn();

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

  // Code export options (C Header or Assembly)
  const [codeOutputFormat, setCodeOutputFormat] = useState<CodeOutputFormat>("c-header");
  const [cHeaderOptions, setCHeaderOptions] = useState<CHeaderOptions>(getDefaultCHeaderOptions(""));
  const [assemblyOptions, setAssemblyOptions] = useState<AssemblyOptions>(getDefaultAssemblyOptions(""));

  // PNG options
  const [pngOptions, setPngOptions] = useState<PngOptions>(getDefaultPngOptions());

  // Reference sheet options
  const [referenceSheetOptions, setReferenceSheetOptions] = useState<ReferenceSheetOptions>(
    getDefaultReferenceSheetOptions(""),
  );

  // Binary preview row index (navigates through rows, each row may have multiple bytes)
  const [previewRowIndex, setPreviewRowIndex] = useState(0);

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

          // Load saved color preset for export options
          const savedColors = getActiveColors();
          setPngOptions((prev) => ({
            ...prev,
            foregroundColor: savedColors.foreground,
            backgroundColor: savedColors.background,
          }));
          setReferenceSheetOptions({
            ...getDefaultReferenceSheetOptions(loaded.metadata.name),
            foregroundColor: savedColors.foreground,
            backgroundColor: savedColors.background,
          });
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

  // Get hex preview with raw bytes for both hex display and bit layout
  const hexPreviewData = useMemo(() => {
    if (!characterSet || characterSet.characters.length === 0) {
      return { hex: "", bytes: [] };
    }
    const config = { ...characterSet.config, padding, bitDirection };
    return getHexPreviewWithBytes(characterSet.characters, config, 512);
  }, [characterSet, padding, bitDirection]);

  // Compute bit layout from the same bytes used in hex preview
  // Handles multi-byte rows (e.g., 12-pixel width = 2 bytes per row)
  const bitLayout = useMemo(() => {
    if (!characterSet || characterSet.characters.length === 0) return null;

    // Calculate bytes per line based on character width
    const bpl = Math.ceil(characterSet.config.width / 8);
    const byteOffset = previewRowIndex * bpl;

    // Get all bytes for this row
    const rowBytes: number[] = [];
    for (let i = 0; i < bpl; i++) {
      rowBytes.push(hexPreviewData.bytes[byteOffset + i] ?? 0);
    }

    // Build bits string from all bytes in the row
    const bits = rowBytes.map(b => b.toString(2).padStart(8, "0")).join("");
    const hex = rowBytes.map(b => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");

    // Calculate padding pattern
    const totalBits = bpl * 8;
    const paddingBits = totalBits - characterSet.config.width;
    let paddingPattern = "";
    if (padding === "left") {
      paddingPattern = "P".repeat(paddingBits) + "D".repeat(characterSet.config.width);
    } else {
      paddingPattern = "D".repeat(characterSet.config.width) + "P".repeat(paddingBits);
    }

    return { bits, hex, padding: paddingPattern, rowIndex: previewRowIndex, bpl };
  }, [characterSet, padding, previewRowIndex, hexPreviewData.bytes]);

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
    if (format === "reference-sheet") {
      return referenceSheetOptions.outputFormat === "pdf" ? ".pdf" : ".png";
    }
    if (format === "code") {
      return codeOutputFormat === "c-header" ? ".h" : ".asm";
    }
    const formatInfo = EXPORT_FORMATS.find((f) => f.id === format);
    return formatInfo?.extension || ".bin";
  }, [format, referenceSheetOptions.outputFormat, codeOutputFormat]);

  // Handle sheet background color change with automatic label color adjustment
  const handleSheetBackgroundChange = useCallback((newColor: string) => {
    const isBright = isBrightColor(newColor);
    const labelColors = isBright ? DARK_LABEL_COLORS : LIGHT_LABEL_COLORS;

    setReferenceSheetOptions((prev) => ({
      ...prev,
      sheetBackgroundColor: newColor,
      ...labelColors,
    }));
  }, []);

  // Update filename extension when format changes
  useEffect(() => {
    if (filename) {
      // Remove existing extension and add new one
      const baseName = filename.replace(/\.(bin|h|asm|inc|png|pdf)$/i, "");
      // For reference sheet format, use the outputFormat to determine extension
      if (format === "reference-sheet") {
        const cleanBase = baseName.replace(/-reference$/, "");
        const newExtension = referenceSheetOptions.outputFormat === "pdf" ? ".pdf" : ".png";
        setFilename(cleanBase + "-reference" + newExtension);
      } else if (format === "code") {
        const newExtension = codeOutputFormat === "c-header" ? ".h" : ".asm";
        setFilename(baseName + newExtension);
      } else {
        const newExtension = EXPORT_FORMATS.find((f) => f.id === format)?.extension || ".bin";
        setFilename(baseName + newExtension);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally excludes filename to prevent infinite loop when updating extension
  }, [format, referenceSheetOptions.outputFormat, codeOutputFormat]);

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
          blob = createDownloadBlob(characterSet.characters, characterSet.config, exportConfig);
          if (!exportFilename.endsWith(".bin")) {
            exportFilename += ".bin";
          }
          break;
        }

        case "code": {
          if (codeOutputFormat === "c-header") {
            const content = exportToCHeader(characterSet.characters, exportConfig, cHeaderOptions);
            blob = new Blob([content], { type: "text/x-c" });
            if (!exportFilename.endsWith(".h")) {
              exportFilename += ".h";
            }
          } else {
            const content = exportToAssembly(characterSet.characters, exportConfig, assemblyOptions);
            blob = new Blob([content], { type: "text/plain" });
            if (!exportFilename.endsWith(".asm") && !exportFilename.endsWith(".inc")) {
              exportFilename += ".asm";
            }
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
          if (referenceSheetOptions.outputFormat === "pdf") {
            blob = await exportToReferenceSheetPdf(characterSet.characters, characterSet.config, referenceSheetOptions);
            if (!exportFilename.endsWith(".pdf")) {
              exportFilename += ".pdf";
            }
          } else {
            blob = await exportToReferenceSheet(characterSet.characters, characterSet.config, referenceSheetOptions);
            if (!exportFilename.endsWith(".png")) {
              exportFilename += ".png";
            }
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
    codeOutputFormat,
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
            <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-lg font-medium text-red-400">{error}</h2>
            <Link
              href={backUrl}
              className="text-sm text-retro-cyan hover:text-retro-pink transition-colors"
            >
              {backLabel}
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
              href={backUrl}
              className="text-xs text-gray-500 hover:text-retro-cyan transition-colors mb-2 inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {backLabel}
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
                      <span className={`text-sm font-medium ${format === f.id ? "text-retro-cyan" : "text-gray-300"}`}>
                        {f.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {f.id === "reference-sheet" ? ".png/.pdf" : f.id === "code" ? ".h/.asm" : f.extension}
                      </span>
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
                  <label htmlFor="filename" className="block text-xs font-medium text-gray-400 mb-1">
                    Filename
                  </label>
                  <input
                    type="text"
                    id="filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
                    placeholder={`charset${getExtension()}`}
                  />
                </div>

                {/* Binary options */}
                {format === "binary" && (
                  <>
                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-2">System Preset</h3>
                      <BinarySystemSelector
                        padding={padding}
                        bitDirection={bitDirection}
                        onSystemChange={(newPadding, newBitDirection) => {
                          setPadding(newPadding);
                          setBitDirection(newBitDirection);
                        }}
                      />
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-2">Bit Padding</h3>
                      <PaddingDirectionSelector value={padding} onChange={setPadding} />
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-2">Bit Direction</h3>
                      <BitDirectionSelector value={bitDirection} onChange={setBitDirection} />
                    </div>
                  </>
                )}

                {/* Code options (C Header or Assembly) */}
                {format === "code" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Output Format</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCodeOutputFormat("c-header")}
                          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                            codeOutputFormat === "c-header"
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }`}
                        >
                          C/C++ Header
                        </button>
                        <button
                          onClick={() => setCodeOutputFormat("assembly")}
                          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                            codeOutputFormat === "assembly"
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }`}
                        >
                          Assembly
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-2">System Preset</h3>
                      <BinarySystemSelector
                        padding={padding}
                        bitDirection={bitDirection}
                        onSystemChange={(newPadding, newBitDirection) => {
                          setPadding(newPadding);
                          setBitDirection(newBitDirection);
                        }}
                      />
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-2">Bit Padding</h3>
                      <PaddingDirectionSelector value={padding} onChange={setPadding} />
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-2">Bit Direction</h3>
                      <BitDirectionSelector value={bitDirection} onChange={setBitDirection} />
                    </div>

                    {/* C Header specific options */}
                    {codeOutputFormat === "c-header" && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Array Name</label>
                          <input
                            type="text"
                            value={cHeaderOptions.arrayName}
                            onChange={(e) => setCHeaderOptions({ ...cHeaderOptions, arrayName: e.target.value })}
                            className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={cHeaderOptions.includeGuards}
                              onChange={(checked) =>
                                setCHeaderOptions({
                                  ...cHeaderOptions,
                                  includeGuards: checked,
                                })
                              }
                            />
                            Include guards (#ifndef)
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={cHeaderOptions.includeComments}
                              onChange={(checked) =>
                                setCHeaderOptions({
                                  ...cHeaderOptions,
                                  includeComments: checked,
                                })
                              }
                            />
                            Include comments
                          </label>
                        </div>
                      </>
                    )}

                    {/* Assembly specific options */}
                    {codeOutputFormat === "assembly" && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Label Name</label>
                          <input
                            type="text"
                            value={assemblyOptions.labelName}
                            onChange={(e) => setAssemblyOptions({ ...assemblyOptions, labelName: e.target.value })}
                            className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white focus:outline-none focus:border-retro-cyan font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Directive Style</label>
                          <SingleSelectDropdown
                            options={[
                              { value: ".byte", label: ".byte (ca65, DASM)" },
                              { value: "db", label: "db (NASM, z80)" },
                              { value: ".db", label: ".db (ASM6)" },
                              { value: "DC.B", label: "DC.B (68000)" },
                            ]}
                            value={assemblyOptions.directive}
                            onChange={(value) =>
                              setAssemblyOptions({
                                ...assemblyOptions,
                                directive: value as AssemblyOptions["directive"],
                              })
                            }
                            ariaLabel="Directive style"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={assemblyOptions.useHex}
                              onChange={(checked) => setAssemblyOptions({ ...assemblyOptions, useHex: checked })}
                            />
                            Use hex values ($FF)
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={assemblyOptions.includeComments}
                              onChange={(checked) =>
                                setAssemblyOptions({
                                  ...assemblyOptions,
                                  includeComments: checked,
                                })
                              }
                            />
                            Include comments
                          </label>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* PNG options */}
                {format === "png" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Columns</label>
                        <SingleSelectDropdown
                          options={[
                            { value: 8, label: "8" },
                            { value: 16, label: "16" },
                            { value: 32, label: "32" },
                          ]}
                          value={pngOptions.columns}
                          onChange={(value) => setPngOptions({ ...pngOptions, columns: value })}
                          ariaLabel="Columns"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Scale</label>
                        <SingleSelectDropdown
                          options={[
                            { value: 1, label: "1x" },
                            { value: 2, label: "2x" },
                            { value: 4, label: "4x" },
                            { value: 8, label: "8x" },
                          ]}
                          value={pngOptions.scale}
                          onChange={(value) => setPngOptions({ ...pngOptions, scale: value })}
                          ariaLabel="Scale"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Colors</label>
                      <ColorPresetSelector
                        colors={{
                          foreground: pngOptions.foregroundColor,
                          background: pngOptions.backgroundColor,
                          gridColor: "#4a4a4a",
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
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                          <ToggleSwitch
                            checked={pngOptions.showGrid}
                            onChange={(checked) => setPngOptions({ ...pngOptions, showGrid: checked })}
                          />
                          Show grid lines
                        </label>
                        {pngOptions.showGrid && (
                          <input
                            type="color"
                            value={pngOptions.gridColor}
                            onChange={(e) => setPngOptions({ ...pngOptions, gridColor: e.target.value })}
                            className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                            title="Grid color"
                          />
                        )}
                      </div>
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <ToggleSwitch
                          checked={pngOptions.transparent}
                          onChange={(checked) => setPngOptions({ ...pngOptions, transparent: checked })}
                        />
                        Transparent background
                      </label>
                    </div>

                    <BloomEffectPanel
                      settings={{
                        scanlines: pngOptions.scanlines,
                        scanlinesIntensity: pngOptions.scanlinesIntensity,
                        bloom: pngOptions.bloom,
                        bloomIntensity: pngOptions.bloomIntensity,
                      }}
                      onChange={(settings: BloomEffectSettings) =>
                        setPngOptions({
                          ...pngOptions,
                          scanlines: settings.scanlines,
                          scanlinesIntensity: settings.scanlinesIntensity,
                          bloom: settings.bloom,
                          bloomIntensity: settings.bloomIntensity,
                        })
                      }
                      defaultCollapsed={true}
                    />
                  </>
                )}

                {/* Reference Sheet options */}
                {format === "reference-sheet" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Output Format</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReferenceSheetOptions({ ...referenceSheetOptions, outputFormat: "png" })}
                          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                            referenceSheetOptions.outputFormat === "png"
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }`}
                        >
                          PNG
                        </button>
                        <button
                          onClick={() => setReferenceSheetOptions({ ...referenceSheetOptions, outputFormat: "pdf" })}
                          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                            referenceSheetOptions.outputFormat === "pdf"
                              ? "border-retro-cyan bg-retro-cyan/10 text-retro-cyan"
                              : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
                          }`}
                        >
                          PDF
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                      <input
                        type="text"
                        value={referenceSheetOptions.title}
                        onChange={(e) => setReferenceSheetOptions({ ...referenceSheetOptions, title: e.target.value })}
                        className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
                        placeholder="Character Set Title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Layout</label>
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
                          <label className="block text-xs font-medium text-gray-400 mb-1">Columns</label>
                          <SingleSelectDropdown
                            options={[
                              { value: 8, label: "8" },
                              { value: 16, label: "16" },
                              { value: 32, label: "32" },
                            ]}
                            value={referenceSheetOptions.columns}
                            onChange={(value) => setReferenceSheetOptions({ ...referenceSheetOptions, columns: value })}
                            ariaLabel="Columns"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Scale</label>
                        <SingleSelectDropdown
                          options={[
                            { value: 3, label: "3x" },
                            { value: 4, label: "4x" },
                            { value: 5, label: "5x" },
                            { value: 6, label: "6x" },
                            { value: 8, label: "8x" },
                          ]}
                          value={referenceSheetOptions.scale}
                          onChange={(value) => setReferenceSheetOptions({ ...referenceSheetOptions, scale: value })}
                          ariaLabel="Scale"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Character Colors</label>
                      <ColorPresetSelector
                        colors={{
                          foreground: referenceSheetOptions.foregroundColor,
                          background: referenceSheetOptions.backgroundColor,
                          gridColor: "#4a4a4a",
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
                      <label className="block text-xs font-medium text-gray-400 mb-1">Sheet Background</label>
                      <div className="flex gap-2">
                        {[
                          { color: "#0d1117", label: "GitHub" },
                          { color: "#1a1a2e", label: "Dark" },
                          { color: "#1e1e1e", label: "VS Code" },
                          { color: "#282c34", label: "One Dark" },
                          { color: "#cacaca", label: "Gray" },
                          { color: "#ffffff", label: "White" },
                        ].map((preset) => (
                          <button
                            key={preset.color}
                            onClick={() => handleSheetBackgroundChange(preset.color)}
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
                          onChange={(e) => handleSheetBackgroundChange(e.target.value)}
                          className="w-8 h-8 rounded border border-retro-grid/50 cursor-pointer"
                          title="Custom color"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Show Labels</label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={referenceSheetOptions.showTitle}
                              onChange={(checked) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showTitle: checked })
                              }
                            />
                            Title header
                          </label>
                          {referenceSheetOptions.showTitle && (
                            <input
                              type="color"
                              value={referenceSheetOptions.titleColor}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, titleColor: e.target.value })
                              }
                              className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                              title="Title color"
                            />
                          )}
                        </div>
                        {referenceSheetOptions.layout === "table" && (
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                              <ToggleSwitch
                                checked={referenceSheetOptions.showGroupLabel}
                                onChange={(checked) =>
                                  setReferenceSheetOptions({ ...referenceSheetOptions, showGroupLabel: checked })
                                }
                              />
                              Group labels
                            </label>
                            {referenceSheetOptions.showGroupLabel && (
                              <input
                                type="color"
                                value={referenceSheetOptions.groupLabelColor}
                                onChange={(e) =>
                                  setReferenceSheetOptions({
                                    ...referenceSheetOptions,
                                    groupLabelColor: e.target.value,
                                  })
                                }
                                className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                                title="Group label color"
                              />
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={referenceSheetOptions.showHex}
                              onChange={(checked) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showHex: checked })
                              }
                            />
                            Hex codes ($00)
                          </label>
                          {referenceSheetOptions.showHex && (
                            <input
                              type="color"
                              value={referenceSheetOptions.hexColor}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, hexColor: e.target.value })
                              }
                              className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                              title="Hex color"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={referenceSheetOptions.showDecimal}
                              onChange={(checked) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showDecimal: checked })
                              }
                            />
                            Decimal codes
                          </label>
                          {referenceSheetOptions.showDecimal && (
                            <input
                              type="color"
                              value={referenceSheetOptions.decimalColor}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, decimalColor: e.target.value })
                              }
                              className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                              title="Decimal color"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={referenceSheetOptions.showOctal}
                              onChange={(checked) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showOctal: checked })
                              }
                            />
                            Octal codes (000)
                          </label>
                          {referenceSheetOptions.showOctal && (
                            <input
                              type="color"
                              value={referenceSheetOptions.octalColor}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, octalColor: e.target.value })
                              }
                              className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                              title="Octal color"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={referenceSheetOptions.showBinary}
                              onChange={(checked) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showBinary: checked })
                              }
                            />
                            Binary codes (00000000)
                          </label>
                          {referenceSheetOptions.showBinary && (
                            <input
                              type="color"
                              value={referenceSheetOptions.binaryColor}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, binaryColor: e.target.value })
                              }
                              className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                              title="Binary color"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={referenceSheetOptions.showAscii}
                              onChange={(checked) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showAscii: checked })
                              }
                            />
                            ASCII printable
                          </label>
                          {referenceSheetOptions.showAscii && (
                            <input
                              type="color"
                              value={referenceSheetOptions.asciiColor}
                              onChange={(e) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, asciiColor: e.target.value })
                              }
                              className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                              title="ASCII printable color"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <ToggleSwitch
                              checked={referenceSheetOptions.showNonPrintableAscii}
                              onChange={(checked) =>
                                setReferenceSheetOptions({ ...referenceSheetOptions, showNonPrintableAscii: checked })
                              }
                            />
                            ASCII non-printable
                          </label>
                          {referenceSheetOptions.showNonPrintableAscii && (
                            <input
                              type="color"
                              value={referenceSheetOptions.nonPrintableAsciiColor}
                              onChange={(e) =>
                                setReferenceSheetOptions({
                                  ...referenceSheetOptions,
                                  nonPrintableAsciiColor: e.target.value,
                                })
                              }
                              className="w-6 h-6 rounded border border-retro-grid/50 cursor-pointer"
                              title="Non-printable ASCII color"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <BloomEffectPanel
                      settings={{
                        scanlines: referenceSheetOptions.scanlines,
                        scanlinesIntensity: referenceSheetOptions.scanlinesIntensity,
                        bloom: referenceSheetOptions.bloom,
                        bloomIntensity: referenceSheetOptions.bloomIntensity,
                      }}
                      onChange={(settings: BloomEffectSettings) =>
                        setReferenceSheetOptions({
                          ...referenceSheetOptions,
                          scanlines: settings.scanlines,
                          scanlinesIntensity: settings.scanlinesIntensity,
                          bloom: settings.bloom,
                          bloomIntensity: settings.bloomIntensity,
                        })
                      }
                      defaultCollapsed={true}
                    />
                  </>
                )}

                {/* Download button */}
                <div className="pt-4">
                  <Button onClick={handleExport} variant="pink" className="w-full" disabled={exporting}>
                    {exporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <div className="bg-black/50 rounded p-3 font-mono text-xs text-retro-cyan max-h-[150px] overflow-hidden">
                        {hexPreviewData.hex && (
                          <div className="break-all">
                            {hexPreviewData.hex}
                            {exportSize > 80 && <> ...</>}
                          </div>
                        )}
                      </div>
                      {exportSize > 80 && (
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent rounded-b pointer-events-none flex items-end justify-center pb-2">
                          <span className="text-[10px] text-gray-500 bg-black/60 px-2 py-0.5 rounded">
                            {formatFileSize(exportSize)} total
                          </span>
                        </div>
                      )}
                    </div>
                    {bitLayout && characterSet && (
                      <div className="bg-retro-navy/50 rounded-lg p-3 border border-retro-grid/30">
                        {/* Bit layout visualization */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Byte Layout</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setPreviewRowIndex(Math.max(0, previewRowIndex - 1))}
                                  disabled={previewRowIndex === 0}
                                  className="w-5 h-5 flex items-center justify-center rounded border border-retro-grid/50 text-gray-400 hover:border-retro-cyan hover:text-retro-cyan disabled:opacity-30 disabled:hover:border-retro-grid/50 disabled:hover:text-gray-400"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <span className="text-xs font-mono text-retro-cyan text-center min-w-[40px]" title={`Row ${previewRowIndex}`}>
                                  {bitLayout.hex}
                                </span>
                                <button
                                  onClick={() => setPreviewRowIndex(Math.min(Math.floor(hexPreviewData.bytes.length / bitLayout.bpl) - 1, previewRowIndex + 1))}
                                  disabled={previewRowIndex >= Math.floor(hexPreviewData.bytes.length / bitLayout.bpl) - 1}
                                  className="w-5 h-5 flex items-center justify-center rounded border border-retro-grid/50 text-gray-400 hover:border-retro-cyan hover:text-retro-cyan disabled:opacity-30 disabled:hover:border-retro-grid/50 disabled:hover:text-gray-400"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-[10px]">
                              <span className="flex items-center gap-1">
                                <span className="text-retro-cyan font-mono">D</span>
                                <span className="text-gray-500">= Data</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-retro-amber font-mono">P</span>
                                <span className="text-gray-500">= Padding</span>
                              </span>
                            </div>
                          </div>
                          <div className="bg-black/30 rounded p-2 font-mono text-sm tracking-wider text-center">
                            {/* Direction arrow */}
                            <div className="flex items-center justify-center text-retro-pink mb-1">
                              <svg className="w-full h-3 max-w-[120px]" viewBox="0 0 80 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <line x1="4" y1="6" x2="76" y2="6" />
                                <polyline points={bitDirection === "ltr" ? "70,2 76,6 70,10" : "10,2 4,6 10,10"} />
                              </svg>
                            </div>
                            {/* Bit pattern (D/P) */}
                            <div>
                              {bitLayout.padding.split("").map((char, i) => (
                                <span
                                  key={i}
                                  className={char === "D" ? "text-retro-cyan" : "text-retro-amber"}
                                >
                                  {char}
                                </span>
                              ))}
                            </div>
                            {/* Actual bit values */}
                            <div className="mt-1">
                              {bitLayout.bits.split("").map((bit, i) => (
                                <span
                                  key={i}
                                  className={bitLayout.padding[i] === "D" ? "text-retro-cyan" : "text-retro-amber"}
                                >
                                  {bit}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* Code preview (C Header or Assembly) */}
                {format === "code" && (
                  <>
                    {codeOutputFormat === "c-header" && cHeaderPreview && (
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
                    {codeOutputFormat === "assembly" && assemblyPreview && (
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
                  </>
                )}

                {/* PNG preview */}
                {format === "png" &&
                  characterSet &&
                  (() => {
                    // Calculate how many characters fit in preview
                    const previewMaxWidth = 320;
                    const previewMaxHeight = 350;
                    const charWidth = characterSet.config.width * pngOptions.scale;
                    const charHeight = characterSet.config.height * pngOptions.scale;
                    const fittingColumns = Math.floor(previewMaxWidth / charWidth);
                    const fittingRows = Math.floor(previewMaxHeight / charHeight);
                    const previewColumns = Math.min(pngOptions.columns, fittingColumns);
                    const previewRows = Math.min(
                      Math.ceil(characterSet.characters.length / pngOptions.columns),
                      fittingRows,
                    );
                    const previewCharCount = Math.min(previewColumns * previewRows, characterSet.characters.length);
                    const totalRows = Math.ceil(characterSet.characters.length / pngOptions.columns);
                    const isClipped =
                      pngOptions.columns > fittingColumns ||
                      totalRows > fittingRows ||
                      characterSet.characters.length > previewCharCount;

                    return (
                      <div className="relative">
                        <div
                          className="bg-black/50 rounded-lg p-4 max-h-[400px] overflow-hidden flex items-start justify-start"
                          style={{ backgroundColor: pngOptions.transparent ? "#1a1a2e" : pngOptions.backgroundColor }}
                        >
                          <CharacterPreview
                            characters={characterSet.characters}
                            config={characterSet.config}
                            maxCharacters={previewCharCount}
                            maxWidth={previewMaxWidth}
                            maxHeight={previewMaxHeight}
                            scale={pngOptions.scale}
                            forceColumns={previewColumns}
                            foregroundColor={pngOptions.foregroundColor}
                            backgroundColor={pngOptions.transparent ? "transparent" : pngOptions.backgroundColor}
                            showCharacterBorders={pngOptions.showGrid}
                            characterBorderColor={pngOptions.gridColor}
                            scanlinesIntensity={pngOptions.scanlines ? pngOptions.scanlinesIntensity : 0}
                            bloomIntensity={pngOptions.bloom ? pngOptions.bloomIntensity : 0}
                          />
                          {pngOptions.columns > fittingColumns && (
                            <div className="flex items-center justify-center text-gray-500 pl-2">
                              <span className="text-lg">...</span>
                            </div>
                          )}
                        </div>
                        {isClipped && (
                          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent rounded-b pointer-events-none flex items-end justify-center pb-2">
                            <span className="text-[10px] text-gray-500 bg-black/60 px-2 py-0.5 rounded">
                              {totalRows} rows × {pngOptions.columns} columns ({characterSet.characters.length}{" "}
                              characters)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* Reference Sheet preview */}
                {format === "reference-sheet" && characterSet && (
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
                            {characterSet.characters.length} characters, {characterSet.config.width}x
                            {characterSet.config.height} pixels
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
                                  width: `${characterSet.config.width * 2 + 8}px`,
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
                          {Array.from({
                            length: Math.min(
                              Math.ceil(characterSet.characters.length / referenceSheetOptions.columns),
                              4,
                            ),
                          }).map((_, rowIdx) => (
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
                                    <div className="border border-gray-700">
                                      <PixelGrid
                                        pixels={char.pixels}
                                        scale={2}
                                        showGrid={false}
                                        foregroundColor={referenceSheetOptions.foregroundColor}
                                        backgroundColor={referenceSheetOptions.backgroundColor}
                                        interactive={false}
                                        scanlinesIntensity={referenceSheetOptions.scanlines ? referenceSheetOptions.scanlinesIntensity : 0}
                                        bloomIntensity={referenceSheetOptions.bloom ? referenceSheetOptions.bloomIntensity : 0}
                                      />
                                    </div>

                                    {/* Labels */}
                                    <div className="text-center leading-tight mt-0.5">
                                      {referenceSheetOptions.showHex && (
                                        <div
                                          className="text-[6px] font-mono"
                                          style={{ color: referenceSheetOptions.hexColor }}
                                        >
                                          ${charIdx.toString(16).toUpperCase().padStart(2, "0")}
                                        </div>
                                      )}
                                      {referenceSheetOptions.showDecimal && (
                                        <div
                                          className="text-[6px] font-mono"
                                          style={{ color: referenceSheetOptions.decimalColor }}
                                        >
                                          {charIdx}
                                        </div>
                                      )}
                                      {referenceSheetOptions.showOctal && (
                                        <div
                                          className="text-[6px] font-mono"
                                          style={{ color: referenceSheetOptions.octalColor }}
                                        >
                                          {charIdx.toString(8).padStart(3, "0")}
                                        </div>
                                      )}
                                      {referenceSheetOptions.showBinary && (
                                        <div
                                          className="text-[5px] font-mono"
                                          style={{ color: referenceSheetOptions.binaryColor }}
                                        >
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
                                      {referenceSheetOptions.showNonPrintableAscii &&
                                        (charIdx < 32 || charIdx === 127) && (
                                          <div
                                            className="text-[5px] font-mono"
                                            style={{ color: referenceSheetOptions.nonPrintableAsciiColor }}
                                          >
                                            {[
                                              "NUL",
                                              "SOH",
                                              "STX",
                                              "ETX",
                                              "EOT",
                                              "ENQ",
                                              "ACK",
                                              "BEL",
                                              "BS",
                                              "TAB",
                                              "LF",
                                              "VT",
                                              "FF",
                                              "CR",
                                              "SO",
                                              "SI",
                                              "DLE",
                                              "DC1",
                                              "DC2",
                                              "DC3",
                                              "DC4",
                                              "NAK",
                                              "SYN",
                                              "ETB",
                                              "CAN",
                                              "EM",
                                              "SUB",
                                              "ESC",
                                              "FS",
                                              "GS",
                                              "RS",
                                              "US",
                                            ][charIdx] || (charIdx === 127 ? "DEL" : "")}
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
                          <div
                            className="flex gap-3 text-[7px] font-mono font-bold border-b border-gray-600 pb-1 mb-1"
                            style={{ color: "#888888" }}
                          >
                            <div className="w-5 text-center">Char</div>
                            {referenceSheetOptions.showDecimal && <div className="w-7 text-center">Dec</div>}
                            {referenceSheetOptions.showBinary && <div className="w-14 text-center">Binary</div>}
                            {referenceSheetOptions.showOctal && <div className="w-7 text-center">Oct</div>}
                            {referenceSheetOptions.showHex && <div className="w-6 text-center">Hex</div>}
                            {(referenceSheetOptions.showAscii || referenceSheetOptions.showNonPrintableAscii) && (
                              <div className="w-8 text-center">ASCII</div>
                            )}
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
                                  <PixelGrid
                                    pixels={char.pixels}
                                    scale={2}
                                    showGrid={false}
                                    foregroundColor={referenceSheetOptions.foregroundColor}
                                    backgroundColor={referenceSheetOptions.backgroundColor}
                                    interactive={false}
                                    scanlinesIntensity={referenceSheetOptions.scanlines ? referenceSheetOptions.scanlinesIntensity : 0}
                                    bloomIntensity={referenceSheetOptions.bloom ? referenceSheetOptions.bloomIntensity : 0}
                                  />
                                </div>
                                {referenceSheetOptions.showDecimal && (
                                  <div
                                    className="w-7 text-center"
                                    style={{ color: referenceSheetOptions.decimalColor }}
                                  >
                                    {charIdx}
                                  </div>
                                )}
                                {referenceSheetOptions.showBinary && (
                                  <div
                                    className="w-14 text-center text-[5px]"
                                    style={{ color: referenceSheetOptions.binaryColor }}
                                  >
                                    {charIdx.toString(2).padStart(8, "0")}
                                  </div>
                                )}
                                {referenceSheetOptions.showOctal && (
                                  <div className="w-7 text-center" style={{ color: referenceSheetOptions.octalColor }}>
                                    {charIdx.toString(8).padStart(3, "0")}
                                  </div>
                                )}
                                {referenceSheetOptions.showHex && (
                                  <div className="w-6 text-center" style={{ color: referenceSheetOptions.hexColor }}>
                                    {charIdx.toString(16).toUpperCase().padStart(2, "0")}
                                  </div>
                                )}
                                {(referenceSheetOptions.showAscii || referenceSheetOptions.showNonPrintableAscii) && (
                                  <div
                                    className="w-8 text-center"
                                    style={{
                                      color: isPrintable
                                        ? referenceSheetOptions.asciiColor
                                        : referenceSheetOptions.nonPrintableAsciiColor,
                                    }}
                                  >
                                    {isPrintable && referenceSheetOptions.showAscii
                                      ? String.fromCharCode(charIdx)
                                      : !isPrintable && referenceSheetOptions.showNonPrintableAscii
                                      ? [
                                          "NUL",
                                          "SOH",
                                          "STX",
                                          "ETX",
                                          "EOT",
                                          "ENQ",
                                          "ACK",
                                          "BEL",
                                          "BS",
                                          "TAB",
                                          "LF",
                                          "VT",
                                          "FF",
                                          "CR",
                                          "SO",
                                          "SI",
                                          "DLE",
                                          "DC1",
                                          "DC2",
                                          "DC3",
                                          "DC4",
                                          "NAK",
                                          "SYN",
                                          "ETB",
                                          "CAN",
                                          "EM",
                                          "SUB",
                                          "ESC",
                                          "FS",
                                          "GS",
                                          "RS",
                                          "US",
                                        ][charIdx] || (charIdx === 127 ? "DEL" : "")
                                      : ""}
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
                      ? characterSet.characters.length > referenceSheetOptions.columns * 4 ||
                        referenceSheetOptions.columns > 8
                      : characterSet.characters.length > 8) && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-10 rounded-b pointer-events-none flex items-end justify-center pb-2"
                        style={{
                          background: `linear-gradient(to top, ${referenceSheetOptions.sheetBackgroundColor}, transparent)`,
                        }}
                      >
                        <span className="text-[10px] text-gray-500 bg-black/60 px-2 py-0.5 rounded">
                          {referenceSheetOptions.layout === "grid"
                            ? `${Math.ceil(characterSet.characters.length / referenceSheetOptions.columns)} rows × ${
                                referenceSheetOptions.columns
                              } columns`
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
                    <span>
                      {characterSet?.config.width}x{characterSet?.config.height}
                    </span>
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
