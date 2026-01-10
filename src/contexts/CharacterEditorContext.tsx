/**
 * Character Editor Display Context
 *
 * Context for sharing display settings across editor components.
 * Provides foreground/background colors, grid settings, and zoom level
 * without requiring prop drilling through the component tree.
 *
 * Two access patterns:
 * - useEditorDisplay(): Returns defaults if outside provider (safe fallback)
 * - useEditorDisplayRequired(): Throws if outside provider (strict mode)
 *
 * @module contexts/CharacterEditorContext
 */
"use client";

import { createContext, useContext, ReactNode } from "react";

/**
 * Editor display settings for the character editor
 */
export interface EditorDisplaySettings {
  /** Foreground color for pixels */
  foregroundColor: string;
  /** Background color for pixels */
  backgroundColor: string;
  /** Grid line color */
  gridColor: string;
  /** Grid line thickness */
  gridThickness: number;
  /** Current zoom level */
  zoom: number;
}

/**
 * Context value for the character editor
 */
export interface CharacterEditorContextValue extends EditorDisplaySettings {
  /** Set the zoom level */
  setZoom?: (zoom: number) => void;
  /** Set colors */
  setColors?: (colors: { foreground: string; background: string; gridColor: string }) => void;
}

/**
 * Default values for the editor context
 */
export const DEFAULT_EDITOR_SETTINGS: EditorDisplaySettings = {
  foregroundColor: "#ffffff",
  backgroundColor: "#000000",
  gridColor: "#333333",
  gridThickness: 1,
  zoom: 20,
};

/**
 * Context for sharing editor display settings across components
 *
 * Use this context to avoid prop drilling for common editor settings
 * like colors, zoom level, and grid settings.
 */
const CharacterEditorContext = createContext<CharacterEditorContextValue | null>(null);

/**
 * Provider props
 */
export interface CharacterEditorProviderProps {
  children: ReactNode;
  value: CharacterEditorContextValue;
}

/**
 * Provider component for character editor context
 *
 * Wrap your editor components with this provider to share display settings.
 *
 * @example
 * ```tsx
 * <CharacterEditorProvider
 *   value={{
 *     foregroundColor: "#00ff00",
 *     backgroundColor: "#000000",
 *     gridColor: "#333333",
 *     gridThickness: 1,
 *     zoom: 20,
 *   }}
 * >
 *   <EditorCanvas />
 *   <CharacterPreview />
 * </CharacterEditorProvider>
 * ```
 */
export function CharacterEditorProvider({ children, value }: CharacterEditorProviderProps) {
  return <CharacterEditorContext.Provider value={value}>{children}</CharacterEditorContext.Provider>;
}

/**
 * Hook to access character editor context
 *
 * Returns the context value if inside a provider, or default values otherwise.
 * This allows components to work both with and without the provider.
 *
 * @returns Editor display settings and actions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { foregroundColor, backgroundColor, zoom } = useEditorDisplay();
 *   // Use the values...
 * }
 * ```
 */
export function useEditorDisplay(): CharacterEditorContextValue {
  const context = useContext(CharacterEditorContext);

  // Return default values if not inside provider
  // This allows components to work standalone
  if (!context) {
    return DEFAULT_EDITOR_SETTINGS;
  }

  return context;
}

/**
 * Hook to require character editor context
 *
 * Unlike useEditorDisplay, this throws an error if used outside a provider.
 * Use this when the provider is required for the component to function.
 *
 * @throws Error if used outside CharacterEditorProvider
 * @returns Editor display settings and actions
 */
export function useEditorDisplayRequired(): CharacterEditorContextValue {
  const context = useContext(CharacterEditorContext);

  if (!context) {
    throw new Error("useEditorDisplayRequired must be used within a CharacterEditorProvider");
  }

  return context;
}
