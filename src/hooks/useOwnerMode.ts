/**
 * Owner Mode Hook
 *
 * Provides a hidden "owner mode" feature for site administrators.
 * Owner mode is enabled by clicking the "C" in the copyright text
 * in the footer. When enabled, additional features become available.
 *
 * Features enabled in owner mode:
 * - Export All button in character editor library
 *
 * The state is persisted in localStorage and survives page refreshes.
 *
 * @module hooks/useOwnerMode
 */
"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "retrostack-owner-mode";

/**
 * Get the current owner mode value from localStorage
 */
function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Server snapshot always returns false (no localStorage on server)
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Subscribe to storage events for cross-tab sync
 */
function subscribe(callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

/**
 * Hook for accessing and toggling owner mode
 *
 * @returns Object with isOwnerMode state and toggle function
 *
 * @example
 * ```tsx
 * const { isOwnerMode, toggleOwnerMode } = useOwnerMode();
 *
 * // In footer copyright
 * <span onClick={toggleOwnerMode}>©</span>
 *
 * // In library view
 * {isOwnerMode && <Button href="/export-all">Export All</Button>}
 * ```
 */
export function useOwnerMode() {
  const isOwnerMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Toggle owner mode
  const toggleOwnerMode = useCallback(() => {
    try {
      const currentValue = localStorage.getItem(STORAGE_KEY) === "true";
      const newValue = !currentValue;
      if (newValue) {
        localStorage.setItem(STORAGE_KEY, "true");
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      // Dispatch storage event for same-tab reactivity
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    } catch {
      // localStorage might not be available
    }
  }, []);

  return {
    isOwnerMode,
    toggleOwnerMode,
  };
}
