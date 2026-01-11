/**
 * Tips Overlay Hook
 *
 * Manages the Tips & Tricks overlay state with localStorage persistence.
 * Tracks whether tips have been seen, auto-show preference, and category
 * expansion state.
 *
 * Features:
 * - Auto-show on first visit (can be disabled)
 * - Persistent preference for "show on startup"
 * - Category expansion state tracking
 * - Reset to show tips again
 *
 * Supports dependency injection for testing via IKeyValueStorage.
 *
 * @module hooks/character-editor/useTipsOverlay
 */
"use client";
/* eslint-disable react-hooks/set-state-in-effect -- SSR-safe hydration from localStorage */

import { useState, useEffect, useCallback } from "react";
import { CHARACTER_EDITOR_STORAGE_KEY_TIPS_OVERLAY } from "@/lib/character-editor/storage/keys";
import { IKeyValueStorage } from "@/lib/character-editor/storage/interfaces";
import { TipsOverlayPreferences, DEFAULT_TIPS_PREFERENCES } from "@/lib/character-editor/tips/types";

/**
 * Default localStorage wrapper that implements IKeyValueStorage
 */
const defaultStorage: IKeyValueStorage = {
  getItem: (key) => (typeof window !== "undefined" ? localStorage.getItem(key) : null),
  setItem: (key, value) => {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  },
};

/**
 * Load tips overlay preferences from storage
 */
function loadPreferences(storage: IKeyValueStorage): TipsOverlayPreferences {
  try {
    const stored = storage.getItem(CHARACTER_EDITOR_STORAGE_KEY_TIPS_OVERLAY);
    if (stored) {
      return JSON.parse(stored) as TipsOverlayPreferences;
    }
  } catch {
    // Ignore errors
  }
  return { ...DEFAULT_TIPS_PREFERENCES };
}

/**
 * Save tips overlay preferences to storage
 */
function savePreferences(storage: IKeyValueStorage, preferences: TipsOverlayPreferences): void {
  try {
    storage.setItem(CHARACTER_EDITOR_STORAGE_KEY_TIPS_OVERLAY, JSON.stringify(preferences));
  } catch {
    // Ignore errors
  }
}

export interface UseTipsOverlayOptions {
  /** Whether the feature is enabled */
  enabled?: boolean;
  /** Optional storage implementation for dependency injection (defaults to localStorage) */
  storage?: IKeyValueStorage;
}

export interface UseTipsOverlayResult {
  /** Whether the overlay is currently open */
  isOpen: boolean;
  /** Open the overlay manually */
  open: () => void;
  /** Close the overlay */
  close: () => void;
  /** Whether auto-show on startup is enabled */
  autoShowEnabled: boolean;
  /** Toggle auto-show preference */
  setAutoShowEnabled: (enabled: boolean) => void;
  /** Whether this is the first visit and overlay should auto-show */
  shouldAutoShow: boolean;
  /** Mark the overlay as seen (prevents future auto-show) */
  markAsSeen: () => void;
  /** Reset preferences (show again on next visit) */
  resetPreferences: () => void;
  /** Currently expanded category IDs */
  expandedCategories: string[];
  /** Toggle a category's expansion state */
  toggleCategory: (categoryId: string) => void;
  /** Expand a category */
  expandCategory: (categoryId: string) => void;
  /** Collapse a category */
  collapseCategory: (categoryId: string) => void;
}

/**
 * Hook for managing the Tips & Tricks overlay
 *
 * @param options - Configuration including optional storage
 */
export function useTipsOverlay(options: UseTipsOverlayOptions = {}): UseTipsOverlayResult {
  const { enabled = true, storage = defaultStorage } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<TipsOverlayPreferences>(() => ({
    ...DEFAULT_TIPS_PREFERENCES,
  }));
  const [mounted, setMounted] = useState(false);

  // Load preferences from storage on mount
  useEffect(() => {
    const loaded = loadPreferences(storage);
    setPreferences(loaded);
    setMounted(true);
  }, [storage]);

  // Auto-show for first-time users
  useEffect(() => {
    if (mounted && enabled && !preferences.hasSeen && preferences.showOnFirstVisit) {
      // Small delay to let the UI settle
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mounted, enabled, preferences.hasSeen, preferences.showOnFirstVisit]);

  // Open the overlay
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close the overlay
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Mark as seen (called when overlay is closed for the first time)
  const markAsSeen = useCallback(() => {
    if (!preferences.hasSeen) {
      const newPreferences: TipsOverlayPreferences = {
        ...preferences,
        hasSeen: true,
        lastDismissedAt: Date.now(),
      };
      setPreferences(newPreferences);
      savePreferences(storage, newPreferences);
    }
  }, [preferences, storage]);

  // Toggle auto-show preference
  const setAutoShowEnabled = useCallback(
    (enabled: boolean) => {
      const newPreferences: TipsOverlayPreferences = {
        ...preferences,
        showOnFirstVisit: enabled,
      };
      setPreferences(newPreferences);
      savePreferences(storage, newPreferences);
    },
    [preferences, storage]
  );

  // Reset preferences
  const resetPreferences = useCallback(() => {
    const newPreferences = { ...DEFAULT_TIPS_PREFERENCES };
    setPreferences(newPreferences);
    savePreferences(storage, newPreferences);
  }, [storage]);

  // Toggle category expansion
  const toggleCategory = useCallback(
    (categoryId: string) => {
      const isExpanded = preferences.expandedCategories.includes(categoryId);
      const newExpandedCategories = isExpanded
        ? preferences.expandedCategories.filter((id) => id !== categoryId)
        : [...preferences.expandedCategories, categoryId];

      const newPreferences: TipsOverlayPreferences = {
        ...preferences,
        expandedCategories: newExpandedCategories,
      };
      setPreferences(newPreferences);
      savePreferences(storage, newPreferences);
    },
    [preferences, storage]
  );

  // Expand a category
  const expandCategory = useCallback(
    (categoryId: string) => {
      if (!preferences.expandedCategories.includes(categoryId)) {
        const newPreferences: TipsOverlayPreferences = {
          ...preferences,
          expandedCategories: [...preferences.expandedCategories, categoryId],
        };
        setPreferences(newPreferences);
        savePreferences(storage, newPreferences);
      }
    },
    [preferences, storage]
  );

  // Collapse a category
  const collapseCategory = useCallback(
    (categoryId: string) => {
      if (preferences.expandedCategories.includes(categoryId)) {
        const newPreferences: TipsOverlayPreferences = {
          ...preferences,
          expandedCategories: preferences.expandedCategories.filter((id) => id !== categoryId),
        };
        setPreferences(newPreferences);
        savePreferences(storage, newPreferences);
      }
    },
    [preferences, storage]
  );

  // Compute shouldAutoShow
  const shouldAutoShow = !preferences.hasSeen && preferences.showOnFirstVisit;

  return {
    isOpen,
    open,
    close,
    autoShowEnabled: preferences.showOnFirstVisit,
    setAutoShowEnabled,
    shouldAutoShow,
    markAsSeen,
    resetPreferences,
    expandedCategories: preferences.expandedCategories,
    toggleCategory,
    expandCategory,
    collapseCategory,
  };
}
