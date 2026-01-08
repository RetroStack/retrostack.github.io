/**
 * Character ROM Editor - ASCII Utilities
 *
 * Provides utilities for displaying ASCII character information,
 * including control character names.
 */

/**
 * Control character info with abbreviation and full description
 */
export interface ControlCharInfo {
  /** Short abbreviation (e.g., "NUL", "SOH") */
  abbr: string;
  /** Full descriptive name (e.g., "Null", "Start of Heading") */
  name: string;
}

/**
 * Control character names lookup (ASCII 0-31 and 127)
 */
export const CONTROL_CHAR_NAMES: Record<number, ControlCharInfo> = {
  0: { abbr: "NUL", name: "Null" },
  1: { abbr: "SOH", name: "Start of Heading" },
  2: { abbr: "STX", name: "Start of Text" },
  3: { abbr: "ETX", name: "End of Text" },
  4: { abbr: "EOT", name: "End of Transmission" },
  5: { abbr: "ENQ", name: "Enquiry" },
  6: { abbr: "ACK", name: "Acknowledgement" },
  7: { abbr: "BEL", name: "Bell" },
  8: { abbr: "BS", name: "Backspace" },
  9: { abbr: "HT", name: "Horizontal Tab" },
  10: { abbr: "LF", name: "Line Feed" },
  11: { abbr: "VT", name: "Vertical Tab" },
  12: { abbr: "FF", name: "Form Feed" },
  13: { abbr: "CR", name: "Carriage Return" },
  14: { abbr: "SO", name: "Shift Out" },
  15: { abbr: "SI", name: "Shift In" },
  16: { abbr: "DLE", name: "Data Link Escape" },
  17: { abbr: "DC1", name: "Device Control 1 (XON)" },
  18: { abbr: "DC2", name: "Device Control 2" },
  19: { abbr: "DC3", name: "Device Control 3 (XOFF)" },
  20: { abbr: "DC4", name: "Device Control 4" },
  21: { abbr: "NAK", name: "Negative Acknowledgement" },
  22: { abbr: "SYN", name: "Synchronous Idle" },
  23: { abbr: "ETB", name: "End of Transmission Block" },
  24: { abbr: "CAN", name: "Cancel" },
  25: { abbr: "EM", name: "End of Medium" },
  26: { abbr: "SUB", name: "Substitute" },
  27: { abbr: "ESC", name: "Escape" },
  28: { abbr: "FS", name: "File Separator" },
  29: { abbr: "GS", name: "Group Separator" },
  30: { abbr: "RS", name: "Record Separator" },
  31: { abbr: "US", name: "Unit Separator" },
  127: { abbr: "DEL", name: "Delete" },
};

/**
 * Get the display info for a control character
 * @param index - ASCII character index
 * @returns Control character info or null if not a control character
 */
export function getControlCharInfo(index: number): ControlCharInfo | null {
  return CONTROL_CHAR_NAMES[index] || null;
}

/**
 * Get the display name for a control character (abbreviation only for backwards compatibility)
 * @param index - ASCII character index
 * @returns Control character abbreviation or null if not a control character
 */
export function getCharacterDisplayName(index: number): string | null {
  const info = CONTROL_CHAR_NAMES[index];
  return info ? info.abbr : null;
}

/**
 * Check if a character is printable ASCII (32-126)
 * @param index - ASCII character index
 * @returns true if printable
 */
export function isPrintableAscii(index: number): boolean {
  return index >= 32 && index <= 126;
}

/**
 * Check if a character is a control character
 * @param index - ASCII character index
 * @returns true if control character
 */
export function isControlCharacter(index: number): boolean {
  return index <= 31 || index === 127;
}
