/**
 * Keyboard Shortcuts Hook
 *
 * Manages global keyboard shortcuts for the character editor.
 * Provides utilities for:
 * - Registering keyboard shortcuts with modifiers (Ctrl, Shift, Alt)
 * - Formatting shortcuts for display (cross-platform: ⌘ on Mac, Ctrl on others)
 * - Creating predefined editor shortcuts (undo, transforms, navigation)
 *
 * Ignores shortcuts when typing in input/textarea/select elements
 * (except when modifier keys are held).
 *
 * @module hooks/character-editor/useKeyboardShortcuts
 */
"use client";

import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  context?: string;
}

export interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Element to attach listeners to (default: window) */
  target?: HTMLElement | null;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, target = null } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update ref in effect to avoid setting during render
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input
    const tagName = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tagName === "input" || tagName === "textarea" || tagName === "select") {
      // Allow certain shortcuts even in inputs
      const isModified = e.ctrlKey || e.metaKey;
      if (!isModified) return;
    }

    for (const shortcut of shortcutsRef.current) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
      const shiftMatch = !!shortcut.shift === e.shiftKey;
      const altMatch = !!shortcut.alt === e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const eventTarget = target || window;
    eventTarget.addEventListener("keydown", handleKeyDown as EventListener);

    return () => {
      eventTarget.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [enabled, target, handleKeyDown]);
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

  if (shortcut.ctrl) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  if (shortcut.shift) {
    parts.push(isMac ? "⇧" : "Shift");
  }

  // Format the key
  let key = shortcut.key;
  if (key === " ") key = "Space";
  else if (key === "ArrowUp") key = "↑";
  else if (key === "ArrowDown") key = "↓";
  else if (key === "ArrowLeft") key = "←";
  else if (key === "ArrowRight") key = "→";
  else if (key === "Escape") key = "Esc";
  else if (key === "Delete") key = "Del";
  else if (key === "Backspace") key = "⌫";
  else key = key.toUpperCase();

  parts.push(key);

  return parts.join(isMac ? "" : "+");
}

/**
 * Create editor shortcuts
 */
export function createEditorShortcuts(actions: {
  undo: () => void;
  redo: () => void;
  save: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  shiftUp: () => void;
  shiftDown: () => void;
  shiftLeft: () => void;
  shiftRight: () => void;
  invert: () => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
  selectAll: () => void;
  deleteSelected: () => void;
  addCharacter: () => void;
  duplicateSelected?: () => void;
  showHelp: () => void;
  // Navigation
  navigatePrev?: () => void;
  navigateNext?: () => void;
  navigatePageUp?: () => void;
  navigatePageDown?: () => void;
  navigateFirst?: () => void;
  navigateLast?: () => void;
  goToCharacter?: () => void;
  showAsciiMap?: () => void;
  showTextPreview?: () => void;
  showSnapshots?: () => void;
  showNotes?: () => void;
  // Toolbar actions
  exportSet?: () => void;
  importSet?: () => void;
  shareSet?: () => void;
  saveAs?: () => void;
  editMetadata?: () => void;
  resetChanges?: () => void;
  reorderCharacters?: () => void;
  zoomToFit?: () => void;
}): KeyboardShortcut[] {
  return [
    // Undo/Redo
    {
      key: "z",
      ctrl: true,
      action: actions.undo,
      description: "Undo",
      context: "Editor",
    },
    {
      key: "z",
      ctrl: true,
      shift: true,
      action: actions.redo,
      description: "Redo",
      context: "Editor",
    },
    {
      key: "y",
      ctrl: true,
      action: actions.redo,
      description: "Redo",
      context: "Editor",
    },

    // Save
    {
      key: "s",
      ctrl: true,
      action: actions.save,
      description: "Save",
      context: "Editor",
    },

    // Transforms
    {
      key: "r",
      action: actions.rotateRight,
      description: "Rotate right",
      context: "Editor",
    },
    {
      key: "r",
      shift: true,
      action: actions.rotateLeft,
      description: "Rotate left",
      context: "Editor",
    },
    {
      key: "w",
      action: actions.shiftUp,
      description: "Shift up",
      context: "Editor",
    },
    {
      key: "s",
      action: actions.shiftDown,
      description: "Shift down",
      context: "Editor",
    },
    {
      key: "a",
      action: actions.shiftLeft,
      description: "Shift left",
      context: "Editor",
    },
    {
      key: "d",
      action: actions.shiftRight,
      description: "Shift right",
      context: "Editor",
    },
    {
      key: "i",
      action: actions.invert,
      description: "Invert colors",
      context: "Editor",
    },
    {
      key: "h",
      action: actions.flipHorizontal,
      description: "Flip horizontal",
      context: "Editor",
    },
    {
      key: "v",
      action: actions.flipVertical,
      description: "Flip vertical",
      context: "Editor",
    },

    // Selection
    {
      key: "a",
      ctrl: true,
      action: actions.selectAll,
      description: "Select all",
      context: "Sidebar",
    },
    {
      key: "Delete",
      action: actions.deleteSelected,
      description: "Delete selected",
      context: "Sidebar",
    },
    {
      key: "Backspace",
      action: actions.deleteSelected,
      description: "Delete selected",
      context: "Sidebar",
    },

    // Add
    {
      key: "n",
      ctrl: true,
      action: actions.addCharacter,
      description: "Add new character",
      context: "Editor",
    },

    // Duplicate
    ...(actions.duplicateSelected
      ? [
          {
            key: "d",
            ctrl: true,
            action: actions.duplicateSelected,
            description: "Duplicate selected characters",
            context: "Editor",
          } as KeyboardShortcut,
        ]
      : []),

    // Help
    {
      key: "?",
      action: actions.showHelp,
      description: "Show keyboard shortcuts",
      context: "Global",
    },

    // Navigation (optional - only added if handlers provided)
    ...(actions.navigatePrev
      ? [
          {
            key: "ArrowUp",
            action: actions.navigatePrev,
            description: "Previous character",
            context: "Navigation",
          },
        ]
      : []),
    ...(actions.navigateNext
      ? [
          {
            key: "ArrowDown",
            action: actions.navigateNext,
            description: "Next character",
            context: "Navigation",
          },
        ]
      : []),
    ...(actions.navigatePageUp
      ? [
          {
            key: "PageUp",
            action: actions.navigatePageUp,
            description: "Jump 16 characters up",
            context: "Navigation",
          },
        ]
      : []),
    ...(actions.navigatePageDown
      ? [
          {
            key: "PageDown",
            action: actions.navigatePageDown,
            description: "Jump 16 characters down",
            context: "Navigation",
          },
        ]
      : []),
    ...(actions.navigateFirst
      ? [
          {
            key: "Home",
            action: actions.navigateFirst,
            description: "First character",
            context: "Navigation",
          },
        ]
      : []),
    ...(actions.navigateLast
      ? [
          {
            key: "End",
            action: actions.navigateLast,
            description: "Last character",
            context: "Navigation",
          },
        ]
      : []),
    ...(actions.goToCharacter
      ? [
          {
            key: "g",
            action: actions.goToCharacter,
            description: "Go to character",
            context: "Navigation",
          },
        ]
      : []),
    ...(actions.showAsciiMap
      ? [
          {
            key: "m",
            action: actions.showAsciiMap,
            description: "Show ASCII map",
            context: "Navigation",
          },
        ]
      : []),
    ...(actions.showTextPreview
      ? [
          {
            key: "t",
            action: actions.showTextPreview,
            description: "Text preview",
            context: "View",
          },
        ]
      : []),
    ...(actions.showSnapshots
      ? [
          {
            key: "s",
            ctrl: true,
            shift: true,
            action: actions.showSnapshots,
            description: "Snapshots",
            context: "Editor",
          },
        ]
      : []),
    ...(actions.showNotes
      ? [
          {
            key: "n",
            action: actions.showNotes,
            description: "Notes",
            context: "View",
          },
        ]
      : []),

    // Toolbar actions (optional)
    ...(actions.exportSet
      ? [
          {
            key: "e",
            action: actions.exportSet,
            description: "Export character set",
            context: "File",
          },
        ]
      : []),
    ...(actions.importSet
      ? [
          {
            key: "i",
            ctrl: true,
            action: actions.importSet,
            description: "Import characters",
            context: "File",
          },
        ]
      : []),
    ...(actions.shareSet
      ? [
          {
            key: "e",
            ctrl: true,
            shift: true,
            action: actions.shareSet,
            description: "Share character set",
            context: "File",
          },
        ]
      : []),
    ...(actions.saveAs
      ? [
          {
            key: "s",
            ctrl: true,
            alt: true,
            action: actions.saveAs,
            description: "Save as new",
            context: "File",
          },
        ]
      : []),
    ...(actions.editMetadata
      ? [
          {
            key: "F2",
            action: actions.editMetadata,
            description: "Edit info",
            context: "File",
          },
        ]
      : []),
    ...(actions.resetChanges
      ? [
          {
            key: "r",
            ctrl: true,
            alt: true,
            action: actions.resetChanges,
            description: "Reset changes",
            context: "Editor",
          },
        ]
      : []),
    ...(actions.reorderCharacters
      ? [
          {
            key: "o",
            action: actions.reorderCharacters,
            description: "Reorder characters",
            context: "Editor",
          },
        ]
      : []),
    ...(actions.zoomToFit
      ? [
          {
            key: "0",
            action: actions.zoomToFit,
            description: "Zoom to fit",
            context: "View",
          },
        ]
      : []),
  ];
}
