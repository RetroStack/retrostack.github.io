/**
 * Character ROM Editor - Library Exports
 *
 * Central export point for all character editor utilities.
 */

// Types
export * from "./types";

// Binary conversion
export {
  bytesToCharacter,
  characterToBytes,
  parseCharacterRom,
  serializeCharacterRom,
  binaryToBase64,
  base64ToBinary,
  serializeCharacterSet,
  deserializeCharacterSet,
  convertCharacter,
  createDownloadBlob,
  downloadBlob,
} from "./binary";

// Storage
export {
  characterStorage,
  saveAutoSave,
  getAutoSave,
  clearAutoSave,
  hasNewerAutoSave,
} from "./storage";
export type { AutoSaveData } from "./storage";

// Transforms
export {
  rotateCharacter,
  shiftCharacter,
  resizeCharacter,
  invertCharacter,
  flipHorizontal,
  flipVertical,
  clearCharacter,
  fillCharacter,
  togglePixel,
  setPixel,
  batchTransform,
  getPixelState,
  batchTogglePixel,
  getBoundingBox,
  centerCharacter,
  scaleCharacter,
} from "./transforms";
export type { ScaleAlgorithm, BoundingBox } from "./transforms";

// Color presets
export {
  COLOR_PRESETS,
  getDefaultPreset,
  getPresetById,
  saveSelectedPreset,
  getSavedPresetId,
  saveCustomColors,
  getCustomColors,
  getActiveColors,
} from "./colorPresets";
export type { ColorPreset, CustomColors } from "./colorPresets";

// Default character sets
export {
  getDefaultCharacterSets,
  isBuiltInCharacterSet,
} from "./defaults";

// Manufacturers and systems
export {
  // Central data source
  SYSTEMS,
  getSystemInfo,
  getSystemsWithRomPresets,
  // Derived constants
  KNOWN_MANUFACTURERS,
  SYSTEM_PRESETS,
  SYSTEM_CHARACTER_COUNT_PRESETS,
  DIMENSION_PRESETS,
  CHARACTER_COUNT_PRESETS,
  // Helper functions
  getAllManufacturers,
  getSystemsForManufacturer,
  getAllSystems,
  isKnownManufacturer,
  isKnownSystem,
  getPresetsForSystem,
  findPresetByDimensions,
  getSystemPresetsByManufacturer,
  getSystemCharacterCountPresetsByManufacturer,
} from "./manufacturers";
export type {
  CharacterRomSpec,
  SystemInfo,
  ManufacturerSystems,
  DimensionPreset,
  SystemDimensionPreset,
  CharacterCountPreset,
  SystemCharacterCountPreset,
} from "./manufacturers";

// ASCII utilities
export {
  CONTROL_CHAR_NAMES,
  getCharacterDisplayName,
  isPrintableAscii,
  isControlCharacter,
} from "./ascii";

// Utilities
export {
  formatFileSize,
  formatSize,
  parseSize,
  validateConfig,
  getSuggestedFilename,
  isValidBinaryFile,
  calculateCharacterCount,
  debounce,
  throttle,
  clamp,
  getAnchorLabel,
  formatTimestamp,
  charactersEqual,
} from "./utils";

// Export formats
export {
  EXPORT_FORMATS,
  exportToCHeader,
  exportToAssembly,
  exportToPng,
  exportToReferenceSheet,
  getHexPreview,
  getBitLayoutVisualization,
  getDefaultCHeaderOptions,
  getDefaultAssemblyOptions,
  getDefaultPngOptions,
  getDefaultReferenceSheetOptions,
} from "./exports";
export type {
  ExportFormat,
  ExportFormatInfo,
  CHeaderOptions,
  AssemblyOptions,
  PngOptions,
  ReferenceSheetOptions,
} from "./exports";
