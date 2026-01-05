/**
 * Character ROM Editor - ASCII Utilities
 *
 * Provides utilities for displaying ASCII character information,
 * including control character names.
 */

/**
 * Control character names lookup (ASCII 0-31 and 127)
 */
export const CONTROL_CHAR_NAMES: Record<number, string> = {
  0: "NUL",
  1: "SOH",
  2: "STX",
  3: "ETX",
  4: "EOT",
  5: "ENQ",
  6: "ACK",
  7: "BEL",
  8: "BS",
  9: "HT",
  10: "LF",
  11: "VT",
  12: "FF",
  13: "CR",
  14: "SO",
  15: "SI",
  16: "DLE",
  17: "DC1",
  18: "DC2",
  19: "DC3",
  20: "DC4",
  21: "NAK",
  22: "SYN",
  23: "ETB",
  24: "CAN",
  25: "EM",
  26: "SUB",
  27: "ESC",
  28: "FS",
  29: "GS",
  30: "RS",
  31: "US",
  127: "DEL",
};

/**
 * Get the display name for a control character
 * @param index - ASCII character index
 * @returns Control character name or null if not a control character
 */
export function getCharacterDisplayName(index: number): string | null {
  return CONTROL_CHAR_NAMES[index] || null;
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
