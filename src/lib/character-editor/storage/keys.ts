/**
 * Character ROM Editor - Storage Keys
 *
 * All localStorage and IndexedDB keys for the character editor.
 * Centralizing these ensures consistent naming and makes it easy to
 * find/manage all persisted data.
 *
 * Naming convention:
 * - Editor-specific constants: CHARACTER_EDITOR_<SETTING>
 * - Storage key values: retrostack-character-editor-<setting>
 */

// =============================================================================
// IndexedDB Configuration (shared across app)
// =============================================================================

/** IndexedDB database name */
export const DB_NAME = "retrostack-web";

/** IndexedDB version - bump this when adding new object stores or indexes */
export const DB_VERSION = 9;

// =============================================================================
// Character Editor IndexedDB Stores
// =============================================================================

/** IndexedDB store for character sets */
export const CHARACTER_EDITOR_STORE_NAME = "character-editor-sets";

/** IndexedDB store for character editor snapshots */
export const CHARACTER_EDITOR_SNAPSHOTS_STORE = "character-editor-snapshots";

// =============================================================================
// Character Editor localStorage Keys
// =============================================================================

/** localStorage fallback key for character sets (when IndexedDB unavailable) */
export const CHARACTER_EDITOR_STORAGE_KEY_FALLBACK = "retrostack-character-editor-sets";

/** localStorage key for auto-save data */
export const CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE = "retrostack-character-editor-autosave";

/** localStorage key for selected color preset */
export const CHARACTER_EDITOR_STORAGE_KEY_COLOR_PRESET = "retrostack-character-editor-color-preset";

/** localStorage key for custom colors */
export const CHARACTER_EDITOR_STORAGE_KEY_CUSTOM_COLORS = "retrostack-character-editor-custom-colors";

/** localStorage key for onboarding state */
export const CHARACTER_EDITOR_STORAGE_KEY_ONBOARDING = "retrostack-character-editor-onboarding";

/** localStorage key for library sort field */
export const CHARACTER_EDITOR_STORAGE_KEY_SORT_FIELD = "retrostack-character-editor-sort-field";

/** localStorage key for library sort direction */
export const CHARACTER_EDITOR_STORAGE_KEY_SORT_DIRECTION = "retrostack-character-editor-sort-direction";

/** localStorage key for library page size */
export const CHARACTER_EDITOR_STORAGE_KEY_PAGE_SIZE = "retrostack-character-editor-page-size";

/** localStorage key for CRT simulation settings */
export const CHARACTER_EDITOR_STORAGE_KEY_CRT_SETTINGS = "retrostack-character-editor-crt-settings";
