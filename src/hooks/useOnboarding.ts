"use client";

import { useState, useEffect, useCallback } from "react";

const ONBOARDING_STORAGE_KEY = "retrostack-character-editor-onboarding";

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
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
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
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
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
    description: "This tool lets you create and edit character sets for retro computers. Let's take a quick tour!",
    position: "center",
  },
  {
    id: "library",
    title: "Character Set Library",
    description: "Your character sets are stored here. You can create new ones, import existing ROMs, or edit built-in sets.",
    position: "center",
  },
  {
    id: "import",
    title: "Import Options",
    description: "Import character sets from binary ROM files, PNG images, or even font files (TTF/OTF).",
    position: "center",
  },
  {
    id: "editor",
    title: "Pixel Editor",
    description: "Click to toggle pixels. Drag to paint. Right-click to erase. Use the zoom slider for precision.",
    position: "center",
  },
  {
    id: "transforms",
    title: "Transform Tools",
    description: "Rotate, flip, shift, and invert characters. All transforms support batch editing with multiple selections.",
    position: "center",
  },
  {
    id: "keyboard",
    title: "Keyboard Shortcuts",
    description: "Press ? to see all keyboard shortcuts. Most actions have shortcuts for faster editing.",
    position: "center",
  },
  {
    id: "export",
    title: "Export Formats",
    description: "Export your work as binary ROM files, C header files, assembly code, PNG images, or reference sheets.",
    position: "center",
  },
  {
    id: "done",
    title: "You're Ready!",
    description: "Start by selecting a character set from the library, or create a new one. Happy editing!",
    position: "center",
  },
];
