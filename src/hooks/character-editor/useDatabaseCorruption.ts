/**
 * Database Corruption State Hook
 *
 * Tracks IndexedDB corruption state and provides recovery functionality.
 * Subscribe to corruption events from the storage layer and expose state to UI.
 *
 * @module hooks/character-editor/useDatabaseCorruption
 */
"use client";

import { useState, useEffect } from "react";
import {
  onDatabaseCorruption,
  getDatabaseCorruptionState,
  type DatabaseCorruptionState,
} from "@/lib/character-editor/storage/storage";

export interface UseDatabaseCorruptionResult {
  /** Whether the database is corrupted */
  isCorrupted: boolean;
  /** Error message describing the corruption */
  errorMessage?: string;
}

/**
 * Hook for tracking database corruption state.
 *
 * Subscribes to corruption events from the storage layer and provides
 * the current corruption state to the UI.
 *
 * @returns Current database corruption state
 */
export function useDatabaseCorruption(): UseDatabaseCorruptionResult {
  // Initialize state from current corruption state
  const [state, setState] = useState<DatabaseCorruptionState>(() => {
    // This runs only on initial mount to capture any corruption that was already detected
    return getDatabaseCorruptionState();
  });

  useEffect(() => {
    // Subscribe to corruption state changes
    const unsubscribe = onDatabaseCorruption((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  return {
    isCorrupted: state.isCorrupted,
    errorMessage: state.errorMessage,
  };
}
