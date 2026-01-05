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
} from "./transforms";

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

// Makers and systems
export {
  KNOWN_MAKERS,
  getAllMakers,
  getSystemsForMaker,
  getAllSystems,
  isKnownMaker,
  isKnownSystem,
  DIMENSION_PRESETS,
  getPresetsForSystem,
  findPresetByDimensions,
  SYSTEM_PRESETS,
  getSystemPresetsByMaker,
} from "./makers";
export type { MakerSystems, DimensionPreset, SystemDimensionPreset } from "./makers";

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
  getHexPreview,
  getBitLayoutVisualization,
  getDefaultCHeaderOptions,
  getDefaultAssemblyOptions,
  getDefaultPngOptions,
} from "./exports";
export type {
  ExportFormat,
  ExportFormatInfo,
  CHeaderOptions,
  AssemblyOptions,
  PngOptions,
} from "./exports";
