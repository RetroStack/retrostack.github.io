/**
 * Editor Modal State Management Hook
 *
 * Manages all modal dialogs in the character editor:
 * - Feature modals (mutually exclusive): shortcuts, metadata, resize,
 *   import, copy, reorder, scale, goTo, asciiMap, textPreview, etc.
 * - Confirmation dialogs (independent): delete, reset, leave
 * - Save As dialog (with form state): name input, saving state
 *
 * Uses useModalManager internally for feature modals to ensure
 * only one feature modal is open at a time.
 *
 * @module hooks/character-editor/useEditorModals
 */
"use client";

import { useState, useCallback } from "react";
import { useModalManager } from "@/hooks/useModalManager";

/**
 * Modal keys for the editor - only one feature modal can be open at a time
 */
export type EditorModalKey =
  | "shortcuts"
  | "metadata"
  | "resize"
  | "import"
  | "copy"
  | "reorder"
  | "scale"
  | "goTo"
  | "asciiMap"
  | "textPreview"
  | "snapshots"
  | "share"
  | "overlaySearch";

/**
 * Confirmation dialog keys - these can overlap with feature modals
 */
export type ConfirmDialogKey = "delete" | "reset" | "leave";

/**
 * Save As dialog state - has additional form state
 */
export interface SaveAsDialogState {
  isOpen: boolean;
  name: string;
  isSaving: boolean;
}

/**
 * Hook for managing all editor modal states
 *
 * Features:
 * - Feature modals are mutually exclusive (only one open at a time)
 * - Confirmation dialogs are separate (can appear over feature modals)
 * - Save As dialog has additional form state management
 */
export function useEditorModals() {
  // Feature modals - mutually exclusive
  const featureModals = useModalManager<EditorModalKey>();

  // Confirmation dialogs - can appear independently
  const [confirmDialogs, setConfirmDialogs] = useState<Record<ConfirmDialogKey, boolean>>({
    delete: false,
    reset: false,
    leave: false,
  });

  // Delete operation in progress
  const [isDeleting, setIsDeleting] = useState(false);

  // Save As dialog with form state
  const [saveAsDialog, setSaveAsDialog] = useState<SaveAsDialogState>({
    isOpen: false,
    name: "",
    isSaving: false,
  });

  // Feature modal helpers
  const openModal = useCallback(
    (key: EditorModalKey) => {
      featureModals.open(key);
    },
    [featureModals]
  );

  const closeModal = useCallback(
    (key: EditorModalKey) => {
      featureModals.close(key);
    },
    [featureModals]
  );

  const isModalOpen = useCallback(
    (key: EditorModalKey) => {
      return featureModals.isOpen(key);
    },
    [featureModals]
  );

  // Confirmation dialog helpers
  const openConfirm = useCallback((key: ConfirmDialogKey) => {
    setConfirmDialogs((prev) => ({ ...prev, [key]: true }));
  }, []);

  const closeConfirm = useCallback((key: ConfirmDialogKey) => {
    setConfirmDialogs((prev) => ({ ...prev, [key]: false }));
  }, []);

  const isConfirmOpen = useCallback(
    (key: ConfirmDialogKey) => {
      return confirmDialogs[key];
    },
    [confirmDialogs]
  );

  // Save As dialog helpers
  const openSaveAs = useCallback((defaultName: string = "") => {
    setSaveAsDialog({
      isOpen: true,
      name: defaultName,
      isSaving: false,
    });
  }, []);

  const closeSaveAs = useCallback(() => {
    setSaveAsDialog({
      isOpen: false,
      name: "",
      isSaving: false,
    });
  }, []);

  const setSaveAsName = useCallback((name: string) => {
    setSaveAsDialog((prev) => ({ ...prev, name }));
  }, []);

  const setSaveAsSaving = useCallback((isSaving: boolean) => {
    setSaveAsDialog((prev) => ({ ...prev, isSaving }));
  }, []);

  return {
    // Feature modals (mutually exclusive)
    featureModals: {
      activeModal: featureModals.activeModal,
      isOpen: isModalOpen,
      open: openModal,
      close: closeModal,
      closeAll: featureModals.closeAll,
    },

    // Confirmation dialogs (independent)
    confirmDialogs: {
      isOpen: isConfirmOpen,
      open: openConfirm,
      close: closeConfirm,
      isDeleting,
      setIsDeleting,
    },

    // Save As dialog (with form state)
    saveAsDialog: {
      ...saveAsDialog,
      open: openSaveAs,
      close: closeSaveAs,
      setName: setSaveAsName,
      setSaving: setSaveAsSaving,
    },

    // Convenience checks
    anyModalOpen: featureModals.activeModal !== null,
  };
}

/**
 * Type for the return value of useEditorModals
 */
export type UseEditorModalsResult = ReturnType<typeof useEditorModals>;
