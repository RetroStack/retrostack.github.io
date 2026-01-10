/**
 * Editor Action Handlers Hook
 *
 * Manages high-level editor operations and navigation:
 * - Save: Persist current changes to storage
 * - Save As: Create a copy with a new name
 * - Delete: Remove character set from library
 * - Reset: Discard unsaved changes
 * - Recover: Restore from auto-save data
 * - Resize: Change character dimensions
 * - Metadata Update: Edit name, description, etc.
 * - Navigation: Back button handling with unsaved changes check
 *
 * Extracts action logic from EditView to reduce component complexity.
 * Coordinates with useCharacterEditor, useCharacterLibrary, and useAutoSave.
 *
 * @module hooks/character-editor/useEditorActions
 */
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CharacterSet, AnchorPoint } from "@/lib/character-editor/types";
import { base64ToBinary, parseCharacterRom } from "@/lib/character-editor/import/binary";
import { AutoSaveData } from "@/hooks/character-editor/useAutoSave";
import { UseCharacterEditorResult } from "@/hooks/character-editor/useCharacterEditor";

export interface UseEditorActionsOptions {
  /** Current character set being edited */
  characterSet: CharacterSet | null;
  /** Character set ID */
  id: string | null;
  /** Editor instance from useCharacterEditor */
  editor: UseCharacterEditorResult;
  /** Save function from useCharacterLibrary */
  save: (set: CharacterSet) => Promise<void>;
  /** Delete function from useCharacterLibrary */
  deleteSet: (id: string) => Promise<void>;
  /** Auto-save hook result */
  autoSave: {
    clearAutoSave: () => void;
    recover: () => AutoSaveData | null;
    discard: () => void;
    recoveryData: AutoSaveData | null;
  };
  /** Toast hook for notifications */
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  /** Callback when character set is updated */
  onCharacterSetChange: (set: CharacterSet) => void;
}

export interface UseEditorActionsResult {
  // State
  saving: boolean;
  deleting: boolean;

  // Actions
  handleSave: () => Promise<void>;
  handleSaveAs: (name: string) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleReset: () => void;
  handleRecover: () => void;
  handleResize: (newWidth: number, newHeight: number, anchor: AnchorPoint) => void;
  handleMetadataUpdate: (updates: Partial<CharacterSet["metadata"]>) => Promise<void>;
  handleBack: () => void;
  confirmLeave: () => void;
  handleExport: () => void;

  // Setters
  setDeleting: (value: boolean) => void;
}

/**
 * Hook for managing editor action handlers
 *
 * Extracts the action logic from EditView to reduce component complexity
 */
export function useEditorActions({
  characterSet,
  id,
  editor,
  save,
  deleteSet,
  autoSave,
  toast,
  onCharacterSetChange,
}: UseEditorActionsOptions): UseEditorActionsResult {
  const router = useRouter();

  // Loading states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Save current changes
  const handleSave = useCallback(async () => {
    if (!characterSet) return;

    try {
      setSaving(true);

      const updatedSet: CharacterSet = {
        metadata: {
          ...characterSet.metadata,
          updatedAt: Date.now(),
        },
        config: editor.config,
        characters: editor.characters,
      };

      await save(updatedSet);
      editor.markSaved();
      onCharacterSetChange(updatedSet);
      autoSave.clearAutoSave();
      toast.success("Saved successfully");
    } catch (e) {
      console.error("Failed to save:", e);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [characterSet, editor, save, autoSave, toast, onCharacterSetChange]);

  // Save as new character set
  const handleSaveAs = useCallback(
    async (name: string) => {
      if (!characterSet || !name.trim()) return;

      try {
        const newSet: CharacterSet = {
          metadata: {
            ...characterSet.metadata,
            id: crypto.randomUUID(),
            name: name.trim(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isBuiltIn: false,
          },
          config: editor.config,
          characters: editor.characters,
        };

        await save(newSet);
        autoSave.clearAutoSave();
        toast.success(`Saved as "${name.trim()}"`);

        // Navigate to the new character set
        router.push(`/tools/character-rom-editor/edit?id=${newSet.metadata.id}`);
      } catch (e) {
        console.error("Failed to save as:", e);
        toast.error("Failed to save copy");
      }
    },
    [characterSet, editor, save, autoSave, router, toast]
  );

  // Delete character set
  const handleDelete = useCallback(async () => {
    if (!id) return;

    try {
      setDeleting(true);
      await deleteSet(id);
      toast.success("Character set deleted");
      router.push("/tools/character-rom-editor");
    } catch (e) {
      console.error("Failed to delete:", e);
      toast.error("Failed to delete character set");
    } finally {
      setDeleting(false);
    }
  }, [id, deleteSet, router, toast]);

  // Reset to last saved state
  const handleReset = useCallback(() => {
    if (characterSet) {
      editor.reset(characterSet);
      toast.info("Changes discarded");
    }
  }, [characterSet, editor, toast]);

  // Recover from auto-save
  const handleRecover = useCallback(() => {
    const data = autoSave.recover();
    if (data && characterSet) {
      try {
        const binary = base64ToBinary(data.binaryData);
        const characters = parseCharacterRom(binary, data.config);
        editor.reset({
          ...characterSet,
          characters,
          config: data.config,
        });
        editor.setSelectedIndex(data.selectedIndex);
      } catch (e) {
        console.error("Failed to recover:", e);
        autoSave.discard();
      }
    }
  }, [autoSave, characterSet, editor]);

  // Resize all characters
  const handleResize = useCallback(
    (newWidth: number, newHeight: number, anchor: AnchorPoint) => {
      editor.resizeCharacters(newWidth, newHeight, anchor);
    },
    [editor]
  );

  // Update metadata
  const handleMetadataUpdate = useCallback(
    async (updates: Partial<CharacterSet["metadata"]>) => {
      if (!characterSet) return;

      try {
        const updatedSet: CharacterSet = {
          ...characterSet,
          metadata: {
            ...characterSet.metadata,
            ...updates,
            updatedAt: Date.now(),
          },
        };

        await save(updatedSet);
        onCharacterSetChange(updatedSet);
        toast.success("Info updated");
      } catch (e) {
        console.error("Failed to update metadata:", e);
        toast.error("Failed to update info");
      }
    },
    [characterSet, save, toast, onCharacterSetChange]
  );

  // Navigate back (checks for unsaved changes)
  const handleBack = useCallback(() => {
    // This just returns a flag - the modal opening is handled by the caller
    // to allow for the confirmation dialog pattern
    router.push("/tools/character-rom-editor");
  }, [router]);

  // Confirm leaving (clears auto-save and navigates)
  const confirmLeave = useCallback(() => {
    autoSave.clearAutoSave();
    router.push("/tools/character-rom-editor");
  }, [autoSave, router]);

  // Navigate to export
  const handleExport = useCallback(() => {
    if (id) {
      router.push(`/tools/character-rom-editor/export?id=${id}`);
    }
  }, [id, router]);

  return {
    saving,
    deleting,
    handleSave,
    handleSaveAs,
    handleDelete,
    handleReset,
    handleRecover,
    handleResize,
    handleMetadataUpdate,
    handleBack,
    confirmLeave,
    handleExport,
    setDeleting,
  };
}
