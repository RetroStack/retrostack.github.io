/**
 * Theme Management Hook
 *
 * Manages dark/light mode with localStorage persistence and system
 * preference detection. Supports three modes:
 * - "dark": Always dark mode
 * - "light": Always light mode
 * - "system": Follows OS/browser preference
 *
 * Automatically applies theme class to document.documentElement and
 * updates meta theme-color for mobile browsers.
 *
 * Supports dependency injection for testing via IKeyValueStorage.
 *
 * @module hooks/useTheme
 */
"use client";
/* eslint-disable react-hooks/set-state-in-effect -- SSR-safe hydration from localStorage */

import { useState, useEffect, useCallback } from "react";
import { IKeyValueStorage } from "@/lib/character-editor/storage/interfaces";

export type Theme = "dark" | "light" | "system";

const THEME_STORAGE_KEY = "retrostack-theme";

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
 * Get the system color scheme preference
 */
function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Get the resolved theme (dark or light) from the preference
 */
function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply the theme to the document
 */
function applyTheme(theme: "dark" | "light") {
  if (typeof document === "undefined") return;

  const html = document.documentElement;

  // Remove both classes first
  html.classList.remove("dark", "light");

  // Add the appropriate class
  html.classList.add(theme);

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", theme === "dark" ? "#0a0a1a" : "#ffffff");
  }
}

export interface UseThemeOptions {
  /** Optional storage implementation for dependency injection (defaults to localStorage) */
  storage?: IKeyValueStorage;
}

export interface UseThemeResult {
  /** Current theme preference */
  theme: Theme;
  /** Resolved theme (dark or light) */
  resolvedTheme: "dark" | "light";
  /** Set the theme */
  setTheme: (theme: Theme) => void;
  /** Toggle between dark and light */
  toggleTheme: () => void;
  /** Whether the theme has been loaded from storage */
  mounted: boolean;
}

/**
 * Hook for managing theme (dark/light mode)
 *
 * @param options - Optional configuration including storage implementation
 */
export function useTheme(options?: UseThemeOptions): UseThemeResult {
  const storage = options?.storage ?? defaultStorage;

  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage on mount
  useEffect(() => {
    const stored = storage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initialTheme = stored || "dark"; // Default to dark
    setThemeState(initialTheme);
    applyTheme(resolveTheme(initialTheme));
    setMounted(true);
  }, [storage]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      applyTheme(getSystemTheme());
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Set theme and persist to storage
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      storage.setItem(THEME_STORAGE_KEY, newTheme);
      applyTheme(resolveTheme(newTheme));
    },
    [storage]
  );

  // Toggle between dark and light
  const toggleTheme = useCallback(() => {
    const resolved = resolveTheme(theme);
    const newTheme = resolved === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [theme, setTheme]);

  return {
    theme,
    resolvedTheme: resolveTheme(theme),
    setTheme,
    toggleTheme,
    mounted,
  };
}
