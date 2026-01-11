/**
 * Onboarding Tour Hook
 *
 * Manages multi-step onboarding tours with localStorage persistence.
 * Tracks whether tours have been completed or dismissed, and auto-starts
 * for first-time users.
 *
 * Features:
 * - Step-by-step navigation (next/prev)
 * - Skip/dismiss with "don't show again"
 * - Reset to show tour again
 * - Optional element targeting for highlighting
 *
 * Supports dependency injection for testing via IKeyValueStorage.
 *
 * @module hooks/useOnboarding
 */
"use client";
/* eslint-disable react-hooks/set-state-in-effect -- SSR-safe hydration from localStorage */

import { useState, useEffect, useCallback } from "react";
import { CHARACTER_EDITOR_STORAGE_KEY_ONBOARDING } from "@/lib/character-editor/storage/keys";
import { IKeyValueStorage } from "@/lib/character-editor/storage/interfaces";

/**
 * A single step in the onboarding tour
 */
export interface OnboardingStep {
  /** Unique step ID */
  id: string;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Optional target element selector (for highlighting) */
  target?: string;
  /** Position of the tooltip relative to target */
  position?: "top" | "bottom" | "left" | "right" | "center";
  /** Optional image or icon */
  image?: string;
}

/**
 * Onboarding state stored in localStorage
 */
interface OnboardingState {
  /** Whether the tour has been completed */
  completed: boolean;
  /** Whether the user dismissed the tour */
  dismissed: boolean;
  /** When the state was last updated */
  updatedAt: number;
}

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
 * Get the default onboarding state
 */
function getDefaultState(): OnboardingState {
  return {
    completed: false,
    dismissed: false,
    updatedAt: Date.now(),
  };
}

/**
 * Load onboarding state from storage
 */
function loadState(storage: IKeyValueStorage): OnboardingState {
  try {
    const stored = storage.getItem(CHARACTER_EDITOR_STORAGE_KEY_ONBOARDING);
    if (stored) {
      return JSON.parse(stored) as OnboardingState;
    }
  } catch {
    // Ignore errors
  }
  return getDefaultState();
}

/**
 * Save onboarding state to storage
 */
function saveState(storage: IKeyValueStorage, state: OnboardingState): void {
  try {
    storage.setItem(CHARACTER_EDITOR_STORAGE_KEY_ONBOARDING, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

export interface UseOnboardingOptions {
  /** Steps for the tour */
  steps: OnboardingStep[];
  /** Whether the tour is enabled */
  enabled?: boolean;
  /** Optional storage implementation for dependency injection (defaults to localStorage) */
  storage?: IKeyValueStorage;
}

export interface UseOnboardingResult {
  /** Whether the tour is currently active */
  isActive: boolean;
  /** Current step index */
  currentStep: number;
  /** Current step data */
  currentStepData: OnboardingStep | null;
  /** Total number of steps */
  totalSteps: number;
  /** Whether this is the first step */
  isFirstStep: boolean;
  /** Whether this is the last step */
  isLastStep: boolean;
  /** Start the tour */
  start: () => void;
  /** Go to next step */
  next: () => void;
  /** Go to previous step */
  prev: () => void;
  /** Skip/dismiss the tour */
  skip: () => void;
  /** Complete the tour */
  complete: () => void;
  /** Reset the tour (show again on next visit) */
  reset: () => void;
  /** Whether the tour has been completed */
  hasCompleted: boolean;
  /** Whether the user has dismissed the tour */
  hasDismissed: boolean;
  /** Whether to show the tour automatically (first visit) */
  shouldShowAutomatically: boolean;
}

/**
 * Hook for managing the onboarding tour
 *
 * @param options - Configuration including steps and optional storage
 */
export function useOnboarding(options: UseOnboardingOptions): UseOnboardingResult {
  const { steps, enabled = true, storage = defaultStorage } = options;

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(getDefaultState);
  const [mounted, setMounted] = useState(false);

  // Load state from storage on mount
  useEffect(() => {
    const loaded = loadState(storage);
    setState(loaded);
    setMounted(true);
  }, [storage]);

  // Auto-start for first-time users
  useEffect(() => {
    if (mounted && enabled && !state.completed && !state.dismissed && steps.length > 0) {
      // Small delay to let the UI settle
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mounted, enabled, state.completed, state.dismissed, steps.length]);

  // Start the tour
  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  // Go to next step
  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Complete on last step
      setIsActive(false);
      const newState: OnboardingState = {
        completed: true,
        dismissed: false,
        updatedAt: Date.now(),
      };
      setState(newState);
      saveState(storage, newState);
    }
  }, [currentStep, steps.length, storage]);

  // Go to previous step
  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Skip/dismiss the tour
  const skip = useCallback(() => {
    setIsActive(false);
    const newState: OnboardingState = {
      completed: false,
      dismissed: true,
      updatedAt: Date.now(),
    };
    setState(newState);
    saveState(storage, newState);
  }, [storage]);

  // Complete the tour
  const complete = useCallback(() => {
    setIsActive(false);
    const newState: OnboardingState = {
      completed: true,
      dismissed: false,
      updatedAt: Date.now(),
    };
    setState(newState);
    saveState(storage, newState);
  }, [storage]);

  // Reset the tour
  const reset = useCallback(() => {
    setCurrentStep(0);
    const newState = getDefaultState();
    setState(newState);
    saveState(storage, newState);
  }, [storage]);

  return {
    isActive,
    currentStep,
    currentStepData: steps[currentStep] || null,
    totalSteps: steps.length,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    start,
    next,
    prev,
    skip,
    complete,
    reset,
    hasCompleted: state.completed,
    hasDismissed: state.dismissed,
    shouldShowAutomatically: !state.completed && !state.dismissed,
  };
}

/**
 * Default onboarding steps for the Character ROM Editor
 */
export const CHARACTER_EDITOR_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Character ROM Editor",
    description:
      "Design and edit character sets for retro computers like the C64, Apple II, Atari, and more. This tool supports binary ROMs, pixel editing, and multiple export formats. Let's take a quick tour!",
    position: "center",
  },
  {
    id: "library",
    title: "Character Set Library",
    description:
      "Browse built-in and custom character sets. Use filters to find sets by dimensions, manufacturer, system, or chip. Pin your favorites with the star icon and sort by name, date, or size.",
    position: "center",
  },
  {
    id: "import",
    title: "Import Your Data",
    description:
      "Click 'Import' to load from binary ROM files (.bin), PNG image grids, font files (TTF/OTF/WOFF), or paste code directly from C, JavaScript, or Assembly. The wizard guides you through each format.",
    position: "center",
  },
  {
    id: "editor",
    title: "Pixel Editor",
    description:
      "Click to toggle pixels, drag to paint multiple pixels, and right-click to erase. Use the zoom slider or scroll wheel to adjust the view. Pick a color preset to match your target system's CRT look.",
    position: "center",
  },
  {
    id: "navigation",
    title: "Character Navigation",
    description:
      "Use arrow keys to move between characters, Page Up/Down to jump 16 at a time, or Home/End to jump to the start or end. Press G to go to a specific character by index, hex, or ASCII code. Press M to open the ASCII Map for a visual overview.",
    position: "center",
  },
  {
    id: "transforms",
    title: "Transform Tools",
    description:
      "Rotate characters with [ and ], flip with H (horizontal) or V (vertical), shift pixels with Shift+Arrow keys, and invert colors with I. Use the Scale tool to resize characters with optional smoothing.",
    position: "center",
  },
  {
    id: "overlays",
    title: "Overlays & Comparison",
    description:
      "Load another character set as an overlay to compare designs. Choose from three modes: 1:1 Pixels, Stretch to fit, or Side by Side. Great for matching your design to a reference set.",
    position: "center",
  },
  {
    id: "multiselect",
    title: "Multi-Select & Batch Edit",
    description:
      "Hold Shift and click to select a range, or Ctrl/Cmd+click to select individual characters. Use Ctrl/Cmd+A to select all. In selection mode, apply transforms to multiple characters at once.",
    position: "center",
  },
  {
    id: "saving",
    title: "Saving & History",
    description:
      "Your work auto-saves to recover from unexpected closures. Use Ctrl+S to save explicitly. Create named snapshots to preserve versions. The history slider lets you undo/redo changes with full timestamps.",
    position: "center",
  },
  {
    id: "export",
    title: "Export Your Work",
    description:
      "Press E to export as binary ROM, C/C++ header, assembly code, or PNG image. Generate printable reference sheets in table or grid layout with customizable colors, available as PNG or PDF.",
    position: "center",
  },
  {
    id: "crt",
    title: "CRT Effects",
    description:
      "Enable authentic retro visuals with scanlines and bloom effects. Adjust intensity to taste. Set the pixel aspect ratio to None (square), PAL, or NTSC for accurate display simulation.",
    position: "center",
  },
  {
    id: "help",
    title: "Help & Tips",
    description:
      "Press ? anytime to see all keyboard shortcuts. Click the lightbulb icon for categorized Tips & Tricks covering every feature. Press N to add notes to any character set.",
    position: "center",
  },
  {
    id: "done",
    title: "You're Ready!",
    description:
      "Start by selecting a character set from the library, or click 'New' to create your own. Built-in sets are read-only—use 'Save As' to create an editable copy. Happy designing!",
    position: "center",
  },
];
