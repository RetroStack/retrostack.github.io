/**
 * Change Log Hook
 *
 * Tracks operations performed in the editor for debugging and user feedback.
 * Maintains a rolling log of changes with:
 * - Operation type (edit, add, delete, transform, etc.)
 * - Human-readable description
 * - Affected character indices
 * - Timestamps
 *
 * Provides export functionality for sharing/debugging and color/icon
 * helpers for UI display.
 *
 * @module hooks/character-editor/useChangeLog
 */
"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Types of operations that can be logged
 */
export type ChangeOperationType =
  | "edit"
  | "add"
  | "delete"
  | "transform"
  | "resize"
  | "import"
  | "restore"
  | "copy"
  | "reorder"
  | "batch";

/**
 * A single change log entry
 */
export interface ChangeLogEntry {
  /** Unique entry ID */
  id: string;
  /** When the change occurred */
  timestamp: number;
  /** Type of operation */
  type: ChangeOperationType;
  /** Human-readable description */
  description: string;
  /** Affected character indices */
  affectedIndices: number[];
  /** Optional details */
  details?: string;
}

export interface UseChangeLogOptions {
  /** Maximum number of entries to keep */
  maxEntries?: number;
  /** Whether logging is enabled */
  enabled?: boolean;
}

export interface UseChangeLogResult {
  /** List of log entries */
  entries: ChangeLogEntry[];
  /** Log a new operation */
  log: (type: ChangeOperationType, description: string, affectedIndices?: number[], details?: string) => void;
  /** Clear all log entries */
  clear: () => void;
  /** Export log as text */
  exportAsText: () => string;
  /** Get entry by ID */
  getEntry: (id: string) => ChangeLogEntry | undefined;
  /** Total number of entries */
  count: number;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook for tracking changes/operations in the editor
 */
export function useChangeLog(options: UseChangeLogOptions = {}): UseChangeLogResult {
  const { maxEntries = 100, enabled = true } = options;

  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const idCounterRef = useRef(0);

  // Log a new operation
  const log = useCallback(
    (
      type: ChangeOperationType,
      description: string,
      affectedIndices: number[] = [],
      details?: string
    ) => {
      if (!enabled) return;

      const entry: ChangeLogEntry = {
        id: generateId() + "-" + (idCounterRef.current++),
        timestamp: Date.now(),
        type,
        description,
        affectedIndices,
        details,
      };

      setEntries((prev) => {
        const newEntries = [entry, ...prev];
        // Trim to max entries
        if (newEntries.length > maxEntries) {
          return newEntries.slice(0, maxEntries);
        }
        return newEntries;
      });
    },
    [enabled, maxEntries]
  );

  // Clear all entries
  const clear = useCallback(() => {
    setEntries([]);
  }, []);

  // Export log as text
  const exportAsText = useCallback(() => {
    if (entries.length === 0) {
      return "No changes logged.";
    }

    const lines = [
      "Character ROM Editor - Change Log",
      `Exported: ${new Date().toLocaleString()}`,
      `Total entries: ${entries.length}`,
      "",
      "---",
      "",
    ];

    // Reverse to show oldest first in export
    const sortedEntries = [...entries].reverse();

    for (const entry of sortedEntries) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const date = new Date(entry.timestamp).toLocaleDateString();
      lines.push(`[${date} ${time}] ${entry.type.toUpperCase()}`);
      lines.push(`  ${entry.description}`);
      if (entry.affectedIndices.length > 0) {
        const indices = entry.affectedIndices.length <= 5
          ? entry.affectedIndices.map((i) => `#${i}`).join(", ")
          : `${entry.affectedIndices.slice(0, 5).map((i) => `#${i}`).join(", ")} +${entry.affectedIndices.length - 5} more`;
        lines.push(`  Affected: ${indices}`);
      }
      if (entry.details) {
        lines.push(`  Details: ${entry.details}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }, [entries]);

  // Get entry by ID
  const getEntry = useCallback(
    (id: string) => {
      return entries.find((e) => e.id === id);
    },
    [entries]
  );

  return {
    entries,
    log,
    clear,
    exportAsText,
    getEntry,
    count: entries.length,
  };
}

/**
 * Get a display name for an operation type
 */
export function getOperationDisplayName(type: ChangeOperationType): string {
  const names: Record<ChangeOperationType, string> = {
    edit: "Edit",
    add: "Add",
    delete: "Delete",
    transform: "Transform",
    resize: "Resize",
    import: "Import",
    restore: "Restore",
    copy: "Copy",
    reorder: "Reorder",
    batch: "Batch",
  };
  return names[type] || type;
}

/**
 * Get a color class for an operation type
 */
export function getOperationColor(type: ChangeOperationType): string {
  const colors: Record<ChangeOperationType, string> = {
    edit: "text-retro-cyan",
    add: "text-green-400",
    delete: "text-red-400",
    transform: "text-retro-pink",
    resize: "text-orange-400",
    import: "text-blue-400",
    restore: "text-yellow-400",
    copy: "text-purple-400",
    reorder: "text-emerald-400",
    batch: "text-indigo-400",
  };
  return colors[type] || "text-gray-400";
}

/**
 * Get an icon for an operation type (as SVG path)
 */
export function getOperationIcon(type: ChangeOperationType): string {
  const icons: Record<ChangeOperationType, string> = {
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    add: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    delete: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    transform: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    resize: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4",
    import: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
    restore: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
    reorder: "M4 6h16M4 10h16M4 14h16M4 18h16",
    batch: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  };
  return icons[type] || "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
}
