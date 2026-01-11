/**
 * Simplified Mode Hook
 *
 * Manages user preference for simplified vs full UI mode.
 * Simplified mode hides advanced features for a cleaner interface.
 *
 * Features hidden in simplified mode:
 * - CRT effects panel
 * - Overlay mode
 * - Advanced transform tools (Scale, Copy from set)
 * - Advanced filters
 * - Character management tools (kept: Add only)
 *
 * @module hooks/useSimplifiedMode
 */
"use client";

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from "react";

const STORAGE_KEY = "retrostack-character-editor-simplified-mode";

export interface SimplifiedModeContextValue {
  /** Whether simplified mode is enabled */
  isSimplified: boolean;
  /** Toggle simplified mode on/off */
  toggleSimplifiedMode: () => void;
  /** Set simplified mode explicitly */
  setSimplifiedMode: (enabled: boolean) => void;
}

const SimplifiedModeContext = createContext<SimplifiedModeContextValue | null>(null);

// Helper to get initial value from localStorage
function getInitialValue(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return false;
}

/**
 * Provider component for simplified mode context
 */
export function SimplifiedModeProvider({ children }: { children: ReactNode }) {
  const [isSimplified, setIsSimplified] = useState(getInitialValue);

  // Save preference to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isSimplified));
    } catch {
      // Ignore errors
    }
  }, [isSimplified]);

  const toggleSimplifiedMode = useCallback(() => {
    setIsSimplified((prev) => !prev);
  }, []);

  const setSimplifiedModeValue = useCallback((enabled: boolean) => {
    setIsSimplified(enabled);
  }, []);

  return (
    <SimplifiedModeContext.Provider
      value={{
        isSimplified,
        toggleSimplifiedMode,
        setSimplifiedMode: setSimplifiedModeValue,
      }}
    >
      {children}
    </SimplifiedModeContext.Provider>
  );
}

/**
 * Hook to access simplified mode state
 *
 * Returns the context value if inside a provider, or a default non-simplified state otherwise.
 */
export function useSimplifiedMode(): SimplifiedModeContextValue {
  const context = useContext(SimplifiedModeContext);

  if (!context) {
    // Default to non-simplified mode if used outside provider
    return {
      isSimplified: false,
      toggleSimplifiedMode: () => {},
      setSimplifiedMode: () => {},
    };
  }

  return context;
}

/**
 * Configuration for what's hidden in simplified mode
 */
export const SIMPLIFIED_MODE_CONFIG = {
  // Panels to hide
  hideCRTEffectsPanel: true,
  hideOverlayMode: true,

  // Transform tools to hide
  hideScaleTool: true,
  hideCopyFromSetTool: true,
  hideReorderTool: true,

  // Character tools to hide (keep Add, Duplicate, Delete)
  hideImportTool: false,

  // Toolbar sections to collapse by default
  collapseModifySection: true,
  collapseCharSection: true,

  // Filters to hide
  hideAdvancedFilters: true,

  // Other UI simplifications
  enforceMinimumZoomOnTouch: true,
  minimumTouchZoom: 12,
  showContextualHelp: true,
} as const;
