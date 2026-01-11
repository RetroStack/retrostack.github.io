/**
 * PWA Install Prompt Hook
 *
 * Manages the PWA installation prompt for supported browsers.
 * Captures the beforeinstallprompt event and provides methods
 * to trigger installation.
 *
 * Features:
 * - Detects if app is installable (not already installed)
 * - Captures browser install prompt
 * - Detects iOS (requires manual Add to Home Screen)
 * - SSR-safe with mounted state
 *
 * @module hooks/useInstallPrompt
 */
"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * BeforeInstallPromptEvent interface for the PWA install prompt
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface UseInstallPromptResult {
  /** Whether the app can be installed (prompt available or iOS) */
  canInstall: boolean;
  /** Whether this is iOS (requires manual installation) */
  isIOS: boolean;
  /** Whether the app is already installed as PWA */
  isInstalled: boolean;
  /** Trigger the native install prompt (non-iOS only) */
  promptInstall: () => Promise<boolean>;
  /** Whether the hook has mounted (for SSR safety) */
  mounted: boolean;
}

/**
 * Hook for managing PWA installation
 *
 * @returns Install prompt state and methods
 *
 * @example
 * ```tsx
 * const { canInstall, isIOS, promptInstall } = useInstallPrompt();
 *
 * if (canInstall) {
 *   return (
 *     <button onClick={() => isIOS ? showInstructions() : promptInstall()}>
 *       Install App
 *     </button>
 *   );
 * }
 * ```
 */
export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    setMounted(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  const canInstall = !isInstalled && (deferredPrompt !== null || isIOS);

  return {
    canInstall,
    isIOS,
    isInstalled,
    promptInstall,
    mounted,
  };
}
