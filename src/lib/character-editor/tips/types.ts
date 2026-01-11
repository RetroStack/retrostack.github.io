/**
 * Tips & Tricks Overlay Types
 *
 * TypeScript interfaces for the tips overlay feature.
 * Defines the structure for tips, categories, and user preferences.
 *
 * @module lib/character-editor/tips/types
 */

/**
 * Icon identifiers for tip categories
 */
export type TipCategoryIcon =
  | "pencil"
  | "navigation"
  | "transform"
  | "layers"
  | "keyboard"
  | "overlay"
  | "save"
  | "export";

/**
 * A single tip within a category
 */
export interface Tip {
  /** Unique tip ID */
  id: string;
  /** Short tip title */
  title: string;
  /** Detailed tip description */
  description: string;
  /** Optional image path (relative to /images/tips/) */
  image?: string;
  /** Optional alt text for accessibility */
  imageAlt?: string;
  /** Optional keyboard shortcut to highlight */
  shortcut?: string;
}

/**
 * A category containing multiple tips
 */
export interface TipCategory {
  /** Unique category ID */
  id: string;
  /** Category display name */
  title: string;
  /** Category icon identifier */
  icon: TipCategoryIcon;
  /** Short category description */
  description: string;
  /** Tips within this category */
  tips: Tip[];
  /** Whether category is expanded by default */
  defaultExpanded?: boolean;
}

/**
 * User preferences for the tips overlay
 */
export interface TipsOverlayPreferences {
  /** Whether to show on first visit */
  showOnFirstVisit: boolean;
  /** Whether the overlay has been seen */
  hasSeen: boolean;
  /** Timestamp of last dismissal */
  lastDismissedAt: number | null;
  /** Which categories are expanded (persisted across sessions) */
  expandedCategories: string[];
}

/**
 * Default preferences for new users
 */
export const DEFAULT_TIPS_PREFERENCES: TipsOverlayPreferences = {
  showOnFirstVisit: true,
  hasSeen: false,
  lastDismissedAt: null,
  expandedCategories: [],
};
