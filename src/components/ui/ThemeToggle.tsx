/**
 * Theme Toggle Component
 *
 * A button that toggles between light and dark themes.
 * Features:
 * - Sun icon in dark mode, moon icon in light mode
 * - Tooltip showing which mode will be activated
 * - Hydration-safe rendering (waits for mount)
 * - Uses useTheme hook for state management
 *
 * @module components/ui/ThemeToggle
 */
"use client";

import { useTheme } from "@/hooks/useTheme";
import { Tooltip } from "@/components/ui/Tooltip";

export interface ThemeToggleProps {
  className?: string;
}

/**
 * Theme toggle button component
 */
export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme, mounted } = useTheme();

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className={`p-2 rounded-lg transition-colors ${className}`}
        aria-label="Toggle theme"
        disabled
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip content={isDark ? "Switch to light mode" : "Switch to dark mode"} position="bottom">
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg transition-colors hover:bg-retro-grid/20 ${className}`}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          // Sun icon for dark mode (shows sun to indicate clicking will switch to light)
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          // Moon icon for light mode (shows moon to indicate clicking will switch to dark)
          <svg
            className="w-5 h-5 text-retro-cyan"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>
    </Tooltip>
  );
}
