"use client";
/* eslint-disable react-hooks/set-state-in-effect -- SSR-safe hydration from localStorage */

import { useState, useEffect, useCallback } from "react";
import { CHARACTER_EDITOR_STORAGE_KEY_ONBOARDING } from "@/lib/character-editor/storage/keys";

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
 * Load onboarding state from localStorage
 */
function loadState(): OnboardingState {
  if (typeof window === "undefined") return getDefaultState();

  try {
    const stored = localStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_ONBOARDING);
    if (stored) {
      return JSON.parse(stored) as OnboardingState;
    }
  } catch {
    // Ignore errors
  }

  return getDefaultState();
}

/**
 * Save onboarding state to localStorage
 */
function saveState(state: OnboardingState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CHARACTER_EDITOR_STORAGE_KEY_ONBOARDING, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

export interface UseOnboardingOptions {
  /** Steps for the tour */
  steps: OnboardingStep[];
  /** Whether the tour is enabled */
  enabled?: boolean;
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
 */
export function useOnboarding(options: UseOnboardingOptions): UseOnboardingResult {
  const { steps, enabled = true } = options;

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(getDefaultState);
  const [mounted, setMounted] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setMounted(true);
  }, []);

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
      saveState(newState);
    }
  }, [currentStep, steps.length]);

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
    saveState(newState);
  }, []);

  // Complete the tour
  const complete = useCallback(() => {
    setIsActive(false);
    const newState: OnboardingState = {
      completed: true,
      dismissed: false,
      updatedAt: Date.now(),
    };
    setState(newState);
    saveState(newState);
  }, []);

  // Reset the tour
  const reset = useCallback(() => {
    setCurrentStep(0);
    const newState = getDefaultState();
    setState(newState);
    saveState(newState);
  }, []);

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
    description: "Create and edit character sets for retro computers and vintage display systems. Let's take a quick tour!",
    position: "center",
  },
  {
    id: "library",
    title: "Character Set Library",
    description: "Your character sets are stored here. Filter by size, manufacturer, system, or chip. Pin favorites and sort by any field.",
    position: "center",
  },
  {
    id: "import",
    title: "Import Options",
    description: "Import from binary ROM files, PNG image grids, font files (TTF/OTF/WOFF), or paste code from C, JavaScript, or Assembly.",
    position: "center",
  },
  {
    id: "editor",
    title: "Pixel Editor",
    description: "Click to toggle pixels, drag to paint, right-click to erase. Use overlays to compare with other character sets.",
    position: "center",
  },
  {
    id: "transforms",
    title: "Transform Tools",
    description: "Rotate, flip, shift, invert, and scale characters. Copy from other sets. All transforms support batch editing.",
    position: "center",
  },
  {
    id: "keyboard",
    title: "Keyboard Shortcuts",
    description: "Press ? to see all shortcuts. Navigate with arrow keys, undo/redo with Ctrl+Z/Y, and transform with single keys.",
    position: "center",
  },
  {
    id: "export",
    title: "Export Formats",
    description: "Export as binary ROM, C header, assembly code, PNG image, or printable reference sheets (PNG/PDF) with custom colors.",
    position: "center",
  },
  {
    id: "done",
    title: "You're Ready!",
    description: "Start by selecting a character set from the library, or create a new one. Use snapshots to save your progress!",
    position: "center",
  },
];
