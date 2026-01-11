/**
 * Character ROM Editor - Edit View
 *
 * The main editing interface for character sets. This is the largest and
 * most complex view in the character editor, orchestrating:
 * - Pixel editing canvas (EditorCanvas)
 * - Character grid sidebar (EditorSidebar)
 * - Transform toolbar (rotate, flip, shift, etc.)
 * - History slider for undo/redo navigation
 * - Multiple modals (resize, import, copy, scale, etc.)
 * - Keyboard shortcuts for all operations
 * - Auto-save with recovery
 * - Snapshots for version management
 *
 * Uses useCharacterEditor hook for state management and coordinates
 * with useCharacterLibrary for persistence.
 *
 * @module app/tools/character-rom-editor/edit/EditView
 */
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ToolLayout, ToolContent } from "@/components/layout/ToolLayout";
import { ToolbarItem } from "@/components/ui/ResponsiveToolbar";
import { EditorCanvas } from "@/components/character-editor/editor/EditorCanvas";
import { EditorSidebar } from "@/components/character-editor/editor/EditorSidebar";
import { EditorHeader } from "@/components/character-editor/editor/EditorHeader";
import { EditorFooter } from "@/components/character-editor/editor/EditorFooter";
import { TransformToolbar } from "@/components/character-editor/editor/TransformToolbar";
import { HistorySlider } from "@/components/character-editor/editor/HistorySlider";
import { CharacterDisplay } from "@/components/character-editor/character/CharacterDisplay";
import { CharacterContextMenu, useContextMenu } from "@/components/character-editor/character/CharacterContextMenu";
import { KeyboardShortcutsHelp } from "@/components/character-editor/help/KeyboardShortcutsHelp";
import { MetadataEditModal } from "./modals/MetadataEditModal";
import { ResizeModal } from "./modals/ResizeModal";
import { ImportCharactersModal } from "./modals/ImportCharactersModal";
import { CopyCharacterModal } from "./modals/CopyCharacterModal";
import { ReorderModal } from "./modals/ReorderModal";
import { ScaleModal } from "./modals/ScaleModal";
import { GoToCharacterModal } from "./modals/GoToCharacterModal";
import { AsciiMapModal } from "./modals/AsciiMapModal";
import { TextPreviewModal } from "./modals/TextPreviewModal";
import { SnapshotsModal } from "./modals/SnapshotsModal";
import { ShareModal } from "./modals/ShareModal";
import { OverlaySearchModal } from "./modals/OverlaySearchModal";
import { SimilarCharactersModal } from "./modals/SimilarCharactersModal";
import { NotesModal } from "./modals/NotesModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCharacterLibrary } from "@/hooks/character-editor/useCharacterLibrary";
import { useAutoSave } from "@/hooks/character-editor/useAutoSave";
import { useKeyboardShortcuts, createEditorShortcuts } from "@/hooks/character-editor/useKeyboardShortcuts";
import { useSnapshots } from "@/hooks/character-editor/useSnapshots";
import { useNotes } from "@/hooks/character-editor/useNotes";
import { useCharacterEditor } from "@/hooks/character-editor/useCharacterEditor";
import { CharacterSet, AnchorPoint, generateId } from "@/lib/character-editor/types";
import { getActiveColors, CustomColors } from "@/lib/character-editor/data/colorPresets";
import { base64ToBinary, parseCharacterRom } from "@/lib/character-editor/import/binary";
import { useToast } from "@/hooks/useToast";

/**
 * Edit view for the Character ROM Editor
 */
export function EditView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { getById, save, deleteSet, loading: libraryLoading } = useCharacterLibrary();
  const toast = useToast();

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [characterSet, setCharacterSet] = useState<CharacterSet | null>(null);

  // Editor state
  const editor = useCharacterEditor(characterSet);

  // Color settings
  const [colors, setColors] = useState<CustomColors>(getActiveColors());

  // Zoom state
  const [zoom, setZoom] = useState(20);
  const minZoom = 8;
  const maxZoom = 100;

  // Canvas container ref for zoom-to-fit
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Zoom to fit handler - calculates optimal zoom based on container and character size
  const handleZoomToFit = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Get current dimensions directly from the element
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const charWidth = editor.config.width;
    const charHeight = editor.config.height;

    if (containerWidth === 0 || containerHeight === 0) return;

    // Account for padding and grid lines (add some margin for visual comfort)
    const padding = 40;
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;

    // Calculate the maximum zoom that fits both dimensions
    const maxZoomWidth = availableWidth / charWidth;
    const maxZoomHeight = availableHeight / charHeight;
    const optimalZoom = Math.floor(Math.min(maxZoomWidth, maxZoomHeight));

    // Clamp to valid zoom range
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, optimalZoom));
    setZoom(clampedZoom);
  }, [editor.config.width, editor.config.height]);

  // Hover coordinates state (for pixel coordinate display)
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  // Help modal state
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Metadata edit modal state
  const [showMetadataModal, setShowMetadataModal] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Clear history confirmation state
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  // Delete character confirmation state (for deleting individual characters)
  const [showDeleteCharacterConfirm, setShowDeleteCharacterConfirm] = useState(false);

  // Save as dialog state
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [savingAs, setSavingAs] = useState(false);

  // Duplicate dialog state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  // Resize modal state
  const [showResizeModal, setShowResizeModal] = useState(false);

  // Import characters modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Copy character modal state
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Reorder modal state
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Scale modal state
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showGoToModal, setShowGoToModal] = useState(false);
  const [showAsciiMap, setShowAsciiMap] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Overlay state
  const [overlayCharacterSet, setOverlayCharacterSet] = useState<CharacterSet | null>(null);
  const [showOverlaySearch, setShowOverlaySearch] = useState(false);
  const [showSimilarCharacters, setShowSimilarCharacters] = useState(false);
  const [overlayMode, setOverlayMode] = useState<"stretch" | "pixel" | "side-by-side">("pixel");

  // Leave confirmation state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Context menu state
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  // Auto-save
  const autoSave = useAutoSave({
    characterSetId: id,
    characters: editor.characters,
    config: editor.config,
    selectedIndex: editor.selectedIndex,
    isDirty: editor.isDirty,
    enabled: !!characterSet,
  });

  // Snapshots
  const snapshots = useSnapshots({
    characterSetId: id,
    enabled: !!characterSet,
  });

  // Notes
  const notes = useNotes({
    characterSetId: id,
    enabled: !!characterSet,
  });

  // Handle snapshot save
  const handleSnapshotSave = useCallback(
    async (name: string) => {
      const success = await snapshots.saveNewSnapshot(name, editor.characters, editor.config);
      if (success) {
        toast.success("Snapshot saved");
      }
      return success;
    },
    [snapshots, editor.characters, editor.config, toast],
  );

  // Handle snapshot restore (partial or full)
  const handleSnapshotRestore = useCallback(
    (
      characters: import("@/lib/character-editor/types").Character[],
      selectedIndices: Set<number>,
      snapshotName?: string
    ) => {
      if (characterSet) {
        const selectedCount = selectedIndices.size;

        if (selectedCount === characters.length) {
          // Full restore - use existing reset
          editor.reset({
            ...characterSet,
            characters,
          });
          toast.info(snapshotName ? `Restored: ${snapshotName}` : "Snapshot restored");
        } else {
          // Partial restore - use replaceCharactersAtIndices
          editor.replaceCharactersAtIndices(characters, selectedIndices, "Partial snapshot restore");
          toast.info(
            snapshotName
              ? `Restored ${selectedCount} character${selectedCount !== 1 ? "s" : ""} from: ${snapshotName}`
              : `Restored ${selectedCount} character${selectedCount !== 1 ? "s" : ""}`
          );
        }
      }
    },
    [characterSet, editor, toast],
  );

  // Handle snapshot delete with toast (has inline confirmation dialog)
  const handleSnapshotDelete = useCallback(
    async (snapshotId: string) => {
      const success = await snapshots.remove(snapshotId);
      if (success) {
        toast.success("Snapshot deleted");
      }
      return success;
    },
    [snapshots, toast],
  );

  // Load character set (wait for library to be ready first)
  useEffect(() => {
    async function loadCharacterSet() {
      // Wait for the library to finish loading (it imports built-in sets)
      if (libraryLoading) {
        return;
      }

      if (!id) {
        setError("No character set ID provided");
        setLoading(false);
        return;
      }

      try {
        const loaded = await getById(id);
        if (!loaded) {
          setError("Character set not found");
        } else {
          setCharacterSet(loaded);
          editor.reset(loaded);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load character set");
      } finally {
        setLoading(false);
      }
    }

    loadCharacterSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getById and editor are stable refs from hooks
  }, [id, libraryLoading]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!characterSet) return;

    // Prevent saving built-in sets
    if (characterSet.metadata.isBuiltIn) {
      toast.info("Built-in sets are read-only. Use 'Save As' to create a copy.");
      return;
    }

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
      setCharacterSet(updatedSet);
      autoSave.clearAutoSave();
      toast.success("Saved successfully");
    } catch (e) {
      console.error("Failed to save:", e);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [characterSet, editor, save, autoSave, toast]);

  // Handle back navigation with unsaved changes warning
  const handleBack = useCallback(() => {
    if (editor.isDirty) {
      setShowLeaveConfirm(true);
    } else {
      router.push("/tools/character-rom-editor");
    }
  }, [editor.isDirty, router]);

  // Confirm leaving with unsaved changes
  const confirmLeave = useCallback(() => {
    autoSave.clearAutoSave();
    setShowLeaveConfirm(false);
    router.push("/tools/character-rom-editor");
  }, [autoSave, router]);

  // Handle export
  const handleExport = useCallback(() => {
    if (id) {
      router.push(
        `/tools/character-rom-editor/export?id=${id}&from=editor&editId=${id}`
      );
    }
  }, [id, router]);

  // Handle reset to last saved state
  const handleReset = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  // Confirm reset
  const confirmReset = useCallback(() => {
    if (characterSet) {
      editor.reset(characterSet);
      toast.info("Changes discarded");
    }
    setShowResetConfirm(false);
  }, [characterSet, editor, toast]);

  // Handle clear history
  const handleClearHistory = useCallback(() => {
    setShowClearHistoryConfirm(true);
  }, []);

  // Confirm clear history
  const confirmClearHistory = useCallback(() => {
    editor.clearHistory();
    toast.info("History cleared");
    setShowClearHistoryConfirm(false);
  }, [editor, toast]);

  // Handle resize
  const handleResize = useCallback(
    (newWidth: number, newHeight: number, anchor: AnchorPoint) => {
      editor.resizeCharacters(newWidth, newHeight, anchor);
    },
    [editor],
  );

  // Handle recovery
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
        toast.success("Changes recovered");
      } catch (e) {
        console.error("Failed to recover:", e);
        autoSave.discard();
        toast.error("Failed to recover changes");
      }
    }
  }, [autoSave, characterSet, editor, toast]);

  // Handle Save As
  const handleSaveAs = useCallback(async () => {
    if (!characterSet || !saveAsName.trim()) return;

    try {
      setSavingAs(true);

      const newSet: CharacterSet = {
        metadata: {
          ...characterSet.metadata,
          id: crypto.randomUUID(),
          name: saveAsName.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isBuiltIn: false,
          origin: "copied",
          copiedFromId: characterSet.metadata.id,
          copiedFromName: characterSet.metadata.name,
        },
        config: editor.config,
        characters: editor.characters,
      };

      await save(newSet);
      autoSave.clearAutoSave();
      toast.success(`Saved as "${saveAsName.trim()}"`);

      // Navigate to the new character set
      router.push(`/tools/character-rom-editor/edit?id=${newSet.metadata.id}`);
    } catch (e) {
      console.error("Failed to save as:", e);
      toast.error("Failed to save copy");
    } finally {
      setSavingAs(false);
      setShowSaveAsDialog(false);
      setSaveAsName("");
    }
  }, [characterSet, saveAsName, editor, save, autoSave, router, toast]);

  // Handle delete character set
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
      setShowDeleteConfirm(false);
    }
  }, [id, deleteSet, router, toast]);

  // Handle metadata update
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
        setCharacterSet(updatedSet);
        toast.success("Info updated");
      } catch (e) {
        console.error("Failed to update metadata:", e);
        toast.error("Failed to update info");
      }
    },
    [characterSet, save, toast],
  );

  // Open Save As dialog
  const openSaveAsDialog = useCallback(() => {
    setSaveAsName(characterSet?.metadata.name ? `${characterSet.metadata.name} (copy)` : "");
    setShowSaveAsDialog(true);
  }, [characterSet?.metadata.name]);

  // Open Duplicate dialog
  const openDuplicateDialog = useCallback(() => {
    setDuplicateName(characterSet?.metadata.name ? `${characterSet.metadata.name} (copy)` : "");
    setShowDuplicateDialog(true);
  }, [characterSet?.metadata.name]);

  // Handle duplicate character set
  const handleDuplicate = useCallback(async () => {
    if (!characterSet || !duplicateName.trim()) return;

    try {
      setDuplicating(true);

      // Create the duplicate using current editor state
      const newSet: CharacterSet = {
        metadata: {
          ...characterSet.metadata,
          id: generateId(),
          name: duplicateName.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isBuiltIn: false,
          origin: "copied",
          copiedFromId: characterSet.metadata.id,
          copiedFromName: characterSet.metadata.name,
        },
        config: editor.config,
        characters: editor.characters,
      };

      await save(newSet);
      toast.success(`Duplicated as "${duplicateName.trim()}"`);

      // Navigate to the new character set
      router.push(`/tools/character-rom-editor/edit?id=${newSet.metadata.id}`);
    } catch (e) {
      console.error("Failed to duplicate:", e);
      toast.error("Failed to duplicate character set");
    } finally {
      setDuplicating(false);
      setShowDuplicateDialog(false);
      setDuplicateName("");
    }
  }, [characterSet, duplicateName, editor, save, router, toast]);

  // Navigation handlers
  const totalCharacters = editor.characters.length;

  const navigatePrev = useCallback(() => {
    if (editor.selectedIndex > 0) {
      editor.setSelectedIndex(editor.selectedIndex - 1);
    }
  }, [editor]);

  const navigateNext = useCallback(() => {
    if (editor.selectedIndex < totalCharacters - 1) {
      editor.setSelectedIndex(editor.selectedIndex + 1);
    }
  }, [editor, totalCharacters]);

  const navigatePageUp = useCallback(() => {
    const newIndex = Math.max(0, editor.selectedIndex - 16);
    editor.setSelectedIndex(newIndex);
  }, [editor]);

  const navigatePageDown = useCallback(() => {
    const newIndex = Math.min(totalCharacters - 1, editor.selectedIndex + 16);
    editor.setSelectedIndex(newIndex);
  }, [editor, totalCharacters]);

  const navigateFirst = useCallback(() => {
    editor.setSelectedIndex(0);
  }, [editor]);

  const navigateLast = useCallback(() => {
    editor.setSelectedIndex(totalCharacters - 1);
  }, [editor, totalCharacters]);

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () =>
      createEditorShortcuts({
        undo: editor.undo,
        redo: editor.redo,
        save: handleSave,
        rotateLeft: () => editor.rotateSelected("left"),
        rotateRight: () => editor.rotateSelected("right"),
        shiftUp: () => editor.shiftSelected("up"),
        shiftDown: () => editor.shiftSelected("down"),
        shiftLeft: () => editor.shiftSelected("left"),
        shiftRight: () => editor.shiftSelected("right"),
        invert: editor.invertSelected,
        flipHorizontal: editor.flipSelectedHorizontal,
        flipVertical: editor.flipSelectedVertical,
        selectAll: editor.selectAll,
        deleteSelected: () => setShowDeleteCharacterConfirm(true),
        addCharacter: editor.addCharacter,
        duplicateSelected: editor.duplicateSelected,
        showHelp: () => setShowShortcutsHelp(true),
        // Navigation
        navigatePrev,
        navigateNext,
        navigatePageUp,
        navigatePageDown,
        navigateFirst,
        navigateLast,
        goToCharacter: () => setShowGoToModal(true),
        showAsciiMap: () => setShowAsciiMap(true),
        showTextPreview: () => setShowTextPreview(true),
        showSnapshots: () => setShowSnapshots(true),
        showNotes: () => setShowNotesModal(true),
        // Toolbar actions
        exportSet: handleExport,
        importSet: () => setShowImportModal(true),
        shareSet: () => setShowShare(true),
        saveAs: openSaveAsDialog,
        editMetadata: () => setShowMetadataModal(true),
        resetChanges: handleReset,
        reorderCharacters: () => setShowReorderModal(true),
        zoomToFit: handleZoomToFit,
      }),
    [
      editor,
      handleSave,
      handleExport,
      handleReset,
      handleZoomToFit,
      openSaveAsDialog,
      navigatePrev,
      navigateNext,
      navigatePageUp,
      navigatePageDown,
      navigateFirst,
      navigateLast,
    ],
  );

  useKeyboardShortcuts(shortcuts, { enabled: !showShortcutsHelp });

  // Context menu items
  const contextMenuItems = useMemo(() => {
    if (!contextMenu) return [];

    const index = contextMenu.index;
    const isMultiSelect = editor.batchSelection.size > 0;
    const selectedCount = isMultiSelect ? editor.batchSelection.size + 1 : 1;

    return [
      {
        label: "Edit",
        onClick: () => editor.setSelectedIndex(index),
      },
      {
        label: "Copy From...",
        shortcut: "C",
        onClick: () => setShowCopyModal(true),
      },
      { label: "", onClick: () => {}, divider: true },
      {
        label: "Invert",
        shortcut: "I",
        onClick: editor.invertSelected,
      },
      {
        label: "Clear",
        onClick: editor.clearSelected,
      },
      {
        label: "Fill",
        onClick: editor.fillSelected,
      },
      { label: "", onClick: () => {}, divider: true },
      {
        label: `Delete${isMultiSelect ? ` (${selectedCount})` : ""}`,
        shortcut: "Del",
        onClick: () => {
          setShowDeleteCharacterConfirm(true);
        },
        danger: true,
      },
    ];
  }, [contextMenu, editor]);

  // Toolbar actions - reorganized into logical groups
  // Priority: 3 = essential (always visible), 2 = important, 1 = normal, 0 = low (first to hide)
  const toolbarActions: ToolbarItem[] = [
    // Group 0: Full CHaracter set operations
    {
      id: "new",
      label: "New Set",
      tooltip: "Create a new character set",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          {/* Document with plus */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2v6h6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
        </svg>
      ),
      onClick: () =>
        router.push(`/tools/character-rom-editor/add?from=editor&editId=${id}`),
      priority: 3,
    },
    {
      id: "save",
      label: saving ? "Saving..." : "Save Set",
      tooltip: characterSet?.metadata.isBuiltIn
        ? "Cannot save built-in character set (use Save As)"
        : "Save character set to browser storage",
      shortcut: "Ctrl+S",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          {/* Floppy disk outline */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10l4 4v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"
          />
          {/* Label area */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3v5h8V3" />
          {/* Metal slider */}
          <rect x="14" y="3" width="2" height="5" rx="0.5" fill="currentColor" stroke="none" />
          {/* Center label */}
          <rect x="8" y="12" width="8" height="6" rx="1" strokeWidth={2} />
        </svg>
      ),
      onClick: handleSave,
      disabled: saving || !editor.isDirty || characterSet?.metadata.isBuiltIn,
      active: editor.isDirty && !characterSet?.metadata.isBuiltIn,
      priority: 3,
    },
    {
      id: "save-as",
      label: "Save Set As",
      tooltip: "Save as a new character set with a different name",
      shortcut: "Ctrl+Alt+S",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          {/* Floppy disk outline */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10l4 4v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"
          />
          {/* Label area */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3v5h6V3" />
          {/* Plus sign for "save as" */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 8v4m-2-2h4" />
          {/* Center label */}
          <rect x="8" y="12" width="8" height="6" rx="1" strokeWidth={2} />
        </svg>
      ),
      onClick: openSaveAsDialog,
      priority: 1,
    },
    {
      id: "duplicate",
      label: "Duplicate Set",
      tooltip: "Create a copy of this character set",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          {/* Back document */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2"
          />
          {/* Front document */}
          <rect x="8" y="8" width="12" height="12" rx="2" strokeWidth={2} />
        </svg>
      ),
      onClick: openDuplicateDialog,
      priority: 1,
    },
    {
      id: "delete",
      label: "Delete Set",
      tooltip: "Delete this character set from browser storage",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          {/* Trash can lid */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 3h4" />
          {/* Trash can body */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6v14a2 2 0 002 2h8a2 2 0 002-2V6" />
          {/* Lines inside */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 10v8M14 10v8" />
        </svg>
      ),
      onClick: () => setShowDeleteConfirm(true),
      disabled: characterSet?.metadata.isBuiltIn,
      priority: 1,
    },
    { type: "separator", id: "sep-0" },
    // Group 1: Editing full character set tools
    {
      id: "edit-metadata",
      label: "Edit Info",
      tooltip: "Edit character set name and description",
      shortcut: "F2",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      onClick: () => setShowMetadataModal(true),
      priority: 3,
    },
    {
      id: "resize",
      label: "Resize Set",
      tooltip: "Change character dimensions (width × height)",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      ),
      onClick: () => setShowResizeModal(true),
      priority: 0,
    },
    {
      id: "reorder",
      label: "Reorder",
      tooltip: "Drag and drop to reorder characters",
      shortcut: "O",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      ),
      onClick: () => setShowReorderModal(true),
      priority: 0,
    },
    {
      id: "notes",
      label: "Notes",
      tooltip: "Add notes and annotations",
      shortcut: "N",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      ),
      onClick: () => setShowNotesModal(true),
      priority: 1,
      active: notes.hasNotes,
      activeVariant: "amber" as const,
    },
    { type: "separator", id: "sep-1" },
    // Group 2: Edit history
    {
      id: "undo",
      label: "Undo",
      tooltip: "Undo last change",
      shortcut: "Ctrl+Z",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
      ),
      onClick: editor.undo,
      disabled: !editor.canUndo,
      priority: 3,
    },
    {
      id: "redo",
      label: "Redo",
      tooltip: "Redo last undone change",
      shortcut: "Ctrl+Y",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
          />
        </svg>
      ),
      onClick: editor.redo,
      disabled: !editor.canRedo,
      priority: 3,
    },
    {
      id: "reset",
      label: "Reset Set",
      tooltip: "Discard all unsaved changes",
      shortcut: "Ctrl+Shift+R",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
      onClick: handleReset,
      disabled: !editor.isDirty,
      priority: 2,
    },
    { type: "separator", id: "sep-2" },
    // Group 3: Navigation Tooling
    {
      id: "goto",
      label: "Go to",
      tooltip: "Jump to a specific character by index",
      shortcut: "G",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      onClick: () => setShowGoToModal(true),
      priority: 0,
    },
    {
      id: "ascii-map",
      label: "ASCII Map",
      tooltip: "View all characters in a grid with ASCII codes",
      shortcut: "M",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      onClick: () => setShowAsciiMap(true),
      priority: 0,
    },
    { type: "separator", id: "sep-3" },
    // Group 4: Advanced Tools
    {
      id: "overlay",
      label: "Overlay",
      tooltip: "Overlay another character set for tracing",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      onClick: () => {
        if (overlayCharacterSet) {
          setOverlayCharacterSet(null);
        } else {
          setShowOverlaySearch(true);
        }
      },
      active: !!overlayCharacterSet,
      activeVariant: "amber" as const,
      priority: 0,
    },
    {
      id: "similar-characters",
      label: "Similar",
      tooltip: "Find similar character sets to compare and use as overlay",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      onClick: () => setShowSimilarCharacters(true),
      priority: 0,
    },
    {
      id: "text-preview",
      label: "Preview",
      tooltip: "Preview text rendered with this character set",
      shortcut: "T",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      ),
      onClick: () => setShowTextPreview(true),
      priority: 2,
    },
    {
      id: "snapshots",
      label: `Snapshots (${snapshots.snapshots.length})`,
      tooltip: "Save and restore named versions of your work",
      shortcut: "Ctrl+Shift+S",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      ),
      onClick: () => setShowSnapshots(true),
      priority: 1,
      active: snapshots.snapshots.length > 0,
      activeVariant: "amber" as const,
    },
    { type: "separator", id: "sep-4" },
    // Group 5: Import/Export/Share Tools
    {
      id: "import-set",
      label: "Import Set",
      tooltip: "Import a character set from file",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5v14a2 2 0 002 2h10a2 2 0 002-2V5M12 3v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      ),
      onClick: () =>
        router.push(
          `/tools/character-rom-editor/import?from=editor&editId=${id}`
        ),
      priority: 1,
    },
    {
      id: "export",
      label: "Export Set",
      tooltip: "Export character set as ROM binary file",
      shortcut: "E",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5v14a2 2 0 002 2h10a2 2 0 002-2V5M12 21V9m0 0l4 4m-4-4l-4 4"
          />
        </svg>
      ),
      onClick: handleExport,
      priority: 1,
    },
    {
      id: "share",
      label: "Share",
      tooltip: "Generate a shareable link to this character set",
      shortcut: "Ctrl+Shift+E",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      ),
      onClick: () => setShowShare(true),
      priority: 0,
    },
    { type: "separator", id: "sep-5" },
    // Group 6: Help
    {
      id: "help",
      label: "Help",
      tooltip: "View all keyboard shortcuts and help",
      shortcut: "?",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      onClick: () => setShowShortcutsHelp(true),
      priority: 3,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading character set...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-dark">
        <div className="flex flex-col items-center gap-4 text-center">
          <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-lg font-medium text-red-400">{error}</h2>
          <Link
            href="/tools/character-rom-editor"
            className="text-sm text-retro-cyan hover:text-retro-pink transition-colors"
          >
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const selectedCharacter = editor.characters[editor.selectedIndex] || null;
  const isBatchMode = editor.batchSelection.size > 0;

  return (
    <ToolLayout title={characterSet?.metadata.name || "Character Editor"} toolbar={toolbarActions}>
      {/* Main layout wrapper - flex column to keep bottom bars at bottom */}
      <div className="h-full flex flex-col overflow-hidden">
        {/* Consolidated editor header - fixed height */}
        <EditorHeader
          characterSetName={characterSet?.metadata.name || "Untitled"}
          isBuiltIn={characterSet?.metadata.isBuiltIn}
          isDirty={editor.isDirty}
          characterIndex={editor.selectedIndex}
          totalCharacters={editor.characters.length}
          batchMode={isBatchMode}
          zoom={zoom}
          onZoomChange={setZoom}
          onZoomToFit={handleZoomToFit}
          colors={colors}
          onColorsChange={setColors}
          onBack={handleBack}
          className="flex-shrink-0"
        />

        {/* Main content area - takes remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ToolContent
            leftSidebar={
              <EditorSidebar
                characters={editor.characters}
                config={editor.config}
                selectedIndex={editor.selectedIndex}
                batchSelection={editor.batchSelection}
                onSelect={editor.toggleBatchSelection}
                onAddCharacter={editor.addCharacter}
                onDeleteSelected={() => setShowDeleteCharacterConfirm(true)}
                onSelectAll={editor.selectAll}
                onSelectNone={() => editor.toggleBatchSelection(editor.selectedIndex, false)}
                onContextMenu={showContextMenu}
                foregroundColor={colors.foreground}
                backgroundColor={colors.background}
              />
            }
            leftSidebarWidth="240px"
            rightSidebar={
              <TransformToolbar
                character={selectedCharacter}
                characterWidth={editor.config.width}
                characterHeight={editor.config.height}
                onShift={editor.shiftSelected}
                onRotate={editor.rotateSelected}
                onFlipHorizontal={editor.flipSelectedHorizontal}
                onFlipVertical={editor.flipSelectedVertical}
                onInvert={editor.invertSelected}
                onClear={editor.clearSelected}
                onFill={editor.fillSelected}
                onCenter={editor.centerSelected}
                onScale={() => setShowScaleModal(true)}
                onDelete={() => setShowDeleteCharacterConfirm(true)}
                onCopy={() => setShowCopyModal(true)}
                onAdd={editor.insertCharacterAfter}
                onDuplicate={editor.duplicateSelected}
                onImport={() => setShowImportModal(true)}
                disabled={!selectedCharacter}
                className="h-full"
              />
            }
            rightSidebarWidth="120px"
            rightSidebarCollapsible={false}
          >
            <div className="w-full h-full flex flex-col">
              {/* Overlay mode toggle strip - sticky at top of editor area */}
              {overlayCharacterSet && (
                <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-retro-navy/80 backdrop-blur-sm border-b border-retro-grid/30 text-xs z-10">
                  <span className="text-gray-400">Overlay:</span>
                  <span className="text-retro-amber truncate max-w-[150px]">{overlayCharacterSet.metadata.name}</span>
                  <span className="text-gray-500">|</span>
                  <button
                    onClick={() => setOverlayMode("pixel")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      overlayMode === "pixel" ? "bg-retro-amber/20 text-retro-amber" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    1:1 Pixels
                  </button>
                  <button
                    onClick={() => setOverlayMode("stretch")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      overlayMode === "stretch" ? "bg-retro-amber/20 text-retro-amber" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Stretch
                  </button>
                  <button
                    onClick={() => setOverlayMode("side-by-side")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      overlayMode === "side-by-side" ? "bg-retro-amber/20 text-retro-amber" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Side by Side
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setOverlayCharacterSet(null)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Remove overlay"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Canvas area wrapper - measurement div is here to account for overlay bar */}
              <div className="relative flex-1 min-h-0 w-full">
                {/* Invisible div to measure available space for zoom-to-fit */}
                <div ref={canvasContainerRef} className="absolute inset-0 pointer-events-none" />

                {/* Side-by-side mode: two-column grid layout */}
                {overlayMode === "side-by-side" && overlayCharacterSet ? (
                  <div className="w-full h-full grid grid-cols-2 gap-4">
                    {/* Left column: Main editor */}
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-2">
                          {characterSet?.metadata.name} #{editor.selectedIndex}
                        </div>
                        <EditorCanvas
                          character={selectedCharacter}
                          config={editor.config}
                          onPixelToggle={editor.toggleSelectedPixel}
                          onPixelSet={editor.setSelectedPixel}
                          onDragStart={editor.startBatch}
                          onDragEnd={() => editor.endBatch("Paint pixels")}
                          getPixelState={editor.getSelectedPixelState}
                          batchMode={isBatchMode}
                          foregroundColor={colors.foreground}
                          backgroundColor={colors.background}
                          gridColor={colors.gridColor}
                          zoom={zoom}
                          minZoom={8}
                          maxZoom={100}
                          onZoomChange={setZoom}
                          onPixelHover={(row, col) => setHoverCoords({ x: col, y: row })}
                          onPixelLeave={() => setHoverCoords(null)}
                          overlayCharacter={null}
                          overlayConfig={undefined}
                          overlayMode={overlayMode}
                        />
                      </div>
                    </div>
                    {/* Right column: Comparison view */}
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-2">
                          {overlayCharacterSet.metadata.name} #{editor.selectedIndex}
                        </div>
                        <div className="border border-retro-amber/30 rounded p-1 bg-black/30">
                          <CharacterDisplay
                            character={
                              overlayCharacterSet.characters[editor.selectedIndex] || {
                                pixels: Array(overlayCharacterSet.config.height)
                                  .fill(null)
                                  .map(() => Array(overlayCharacterSet.config.width).fill(false)),
                              }
                            }
                            mode="large"
                            scale={zoom}
                            foregroundColor={colors.foreground}
                            backgroundColor={colors.background}
                            gridColor={colors.gridColor}
                            gridThickness={1}
                            interactive={false}
                          />
                        </div>
                        {!overlayCharacterSet.characters[editor.selectedIndex] && (
                          <div className="text-xs text-gray-500 mt-1">No character at this index</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Normal mode: single centered canvas */
                  <div className="w-full h-full">
                    <EditorCanvas
                      character={selectedCharacter}
                      config={editor.config}
                      onPixelToggle={editor.toggleSelectedPixel}
                      onPixelSet={editor.setSelectedPixel}
                      onDragStart={editor.startBatch}
                      onDragEnd={() => editor.endBatch("Paint pixels")}
                      getPixelState={editor.getSelectedPixelState}
                      batchMode={isBatchMode}
                      foregroundColor={colors.foreground}
                      backgroundColor={colors.background}
                      gridColor={colors.gridColor}
                      zoom={zoom}
                      minZoom={8}
                      maxZoom={100}
                      onZoomChange={setZoom}
                      onPixelHover={(row, col) => setHoverCoords({ x: col, y: row })}
                      onPixelLeave={() => setHoverCoords(null)}
                      overlayCharacter={overlayCharacterSet?.characters[editor.selectedIndex] || null}
                      overlayConfig={overlayCharacterSet?.config}
                      overlayMode={overlayMode}
                    />
                  </div>
                )}
              </div>
            </div>
          </ToolContent>
        </div>

        {/* Fixed bottom bars */}
        {/* History timeline slider */}
        <HistorySlider
          history={editor.history}
          currentIndex={editor.historyIndex}
          onJump={editor.jumpToHistory}
          canRedo={editor.canRedo}
          totalEntries={editor.totalHistoryEntries}
          onClear={handleClearHistory}
        />

        {/* Keyboard shortcuts footer */}
        <EditorFooter hoverCoords={hoverCoords} />
      </div>

      {/* Recovery dialog */}
      <ConfirmDialog
        isOpen={autoSave.hasRecoveryData}
        title="Recover Unsaved Changes?"
        message="We found unsaved changes from a previous session. Would you like to recover them?"
        details={autoSave.recoveryData && <>Last saved: {new Date(autoSave.recoveryData.timestamp).toLocaleString()}</>}
        confirmLabel="Recover"
        cancelLabel="Discard"
        variant="info"
        onConfirm={handleRecover}
        onCancel={autoSave.discard}
      />

      {/* Keyboard shortcuts help */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcuts={shortcuts}
      />

      {/* Metadata edit modal */}
      {characterSet && (
        <MetadataEditModal
          isOpen={showMetadataModal}
          onClose={() => setShowMetadataModal(false)}
          metadata={characterSet.metadata}
          onSave={handleMetadataUpdate}
        />
      )}

      {/* Resize modal */}
      <ResizeModal
        isOpen={showResizeModal}
        onClose={() => setShowResizeModal(false)}
        currentWidth={editor.config.width}
        currentHeight={editor.config.height}
        onResize={handleResize}
      />

      {/* Import characters modal */}
      <ImportCharactersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        currentConfig={editor.config}
        onImport={(chars) => {
          editor.addCharacters(chars);
        }}
      />

      {/* Copy character modal */}
      <CopyCharacterModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        characters={editor.characters}
        currentIndex={editor.selectedIndex}
        onCopy={(sourceIndex) => {
          // Copy to the current selection (and all batch selected)
          const targetIndices = [editor.selectedIndex, ...Array.from(editor.batchSelection)];
          targetIndices.forEach((targetIndex) => {
            editor.copyCharacter(sourceIndex, targetIndex);
          });
        }}
      />

      {/* Reorder characters modal */}
      <ReorderModal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        characters={editor.characters}
        onReorder={(chars) => {
          editor.setCharacters(chars);
        }}
      />

      {/* Scale modal */}
      <ScaleModal
        isOpen={showScaleModal}
        onClose={() => setShowScaleModal(false)}
        onScale={(scale, anchor, algorithm) => {
          editor.scaleSelected(scale, anchor, algorithm);
          setShowScaleModal(false);
        }}
        characters={editor.characters}
        selectedIndices={editor.selectedIndices}
        config={editor.config}
        foregroundColor={colors.foreground}
        backgroundColor={colors.background}
      />

      {/* Go to character modal */}
      <GoToCharacterModal
        isOpen={showGoToModal}
        onClose={() => setShowGoToModal(false)}
        totalCharacters={totalCharacters}
        currentIndex={editor.selectedIndex}
        onGoTo={(index) => editor.setSelectedIndex(index)}
      />

      {/* ASCII map modal */}
      <AsciiMapModal
        isOpen={showAsciiMap}
        onClose={() => setShowAsciiMap(false)}
        characters={editor.characters}
        selectedIndex={editor.selectedIndex}
        onSelect={(index) => editor.setSelectedIndex(index)}
        foregroundColor={colors.foreground}
        backgroundColor={colors.background}
      />

      {/* Text preview modal */}
      <TextPreviewModal
        isOpen={showTextPreview}
        onClose={() => setShowTextPreview(false)}
        characters={editor.characters}
        config={editor.config}
        colors={colors}
      />

      {/* Snapshots modal */}
      <SnapshotsModal
        isOpen={showSnapshots}
        onClose={() => setShowSnapshots(false)}
        snapshots={snapshots.snapshots}
        loading={snapshots.loading}
        error={snapshots.error}
        isAtCapacity={snapshots.isAtCapacity}
        maxSnapshots={snapshots.maxSnapshots}
        currentCharacters={editor.characters}
        currentConfig={editor.config}
        foregroundColor={colors.foreground}
        backgroundColor={colors.background}
        onSave={handleSnapshotSave}
        onRestore={snapshots.restore}
        onDelete={handleSnapshotDelete}
        onRename={snapshots.rename}
        onRestoreApply={handleSnapshotRestore}
      />

      {/* Notes modal */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        notes={notes.notes}
        loading={notes.loading}
        error={notes.error}
        characterSetName={characterSet?.metadata.name ?? ""}
        onAdd={notes.addNote}
        onUpdate={notes.updateNote}
        onDelete={notes.deleteNote}
      />

      {/* Share modal */}
      {characterSet && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          name={characterSet.metadata.name}
          description={characterSet.metadata.description}
          characters={editor.characters}
          config={editor.config}
        />
      )}

      {/* Overlay search modal */}
      <OverlaySearchModal
        isOpen={showOverlaySearch}
        onClose={() => setShowOverlaySearch(false)}
        excludeId={id || undefined}
        onSelectSet={setOverlayCharacterSet}
      />

      {/* Similar characters modal */}
      {characterSet && (
        <SimilarCharactersModal
          isOpen={showSimilarCharacters}
          onClose={() => setShowSimilarCharacters(false)}
          currentCharacters={editor.characters}
          currentConfig={editor.config}
          excludeId={id || undefined}
          foregroundColor={colors.foreground}
          backgroundColor={colors.background}
          onSelectForOverlay={setOverlayCharacterSet}
        />
      )}

      {/* Character context menu */}
      {contextMenu && (
        <CharacterContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenuItems} onClose={hideContextMenu} />
      )}

      {/* Save As dialog */}
      {showSaveAsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSaveAsDialog(false)} />
          <div className="relative w-full max-w-md bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Save As</h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">New name</label>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="Character set name"
                className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && saveAsName.trim()) {
                    handleSaveAs();
                  } else if (e.key === "Escape") {
                    setShowSaveAsDialog(false);
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveAsDialog(false)}
                className="flex-1 px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAs}
                disabled={!saveAsName.trim() || savingAs}
                className="flex-1 px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingAs ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate dialog */}
      {showDuplicateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDuplicateDialog(false)}
          />
          <div className="relative w-full max-w-md bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Duplicate Character Set</h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Name for duplicate</label>
              <input
                type="text"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Character set name"
                className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && duplicateName.trim()) {
                    handleDuplicate();
                  } else if (e.key === "Escape") {
                    setShowDuplicateDialog(false);
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDuplicateDialog(false)}
                className="flex-1 px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={!duplicateName.trim() || duplicating}
                className="flex-1 px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {duplicating ? "Duplicating..." : "Duplicate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl p-6">
            <h2 className="text-lg font-medium text-white mb-2">Delete Character Set?</h2>
            <p className="text-sm text-gray-400 mb-4">
              Are you sure you want to delete &quot;{characterSet?.metadata.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm bg-red-500/20 border border-red-500 rounded text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
          <div className="relative w-full max-w-md bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl p-6">
            <h2 className="text-lg font-medium text-white mb-2">Reset to Last Saved?</h2>
            <p className="text-sm text-gray-400 mb-4">
              This will discard all unsaved changes and restore &quot;{characterSet?.metadata.name}&quot; to its last
              saved state. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 px-4 py-2 text-sm bg-orange-500/20 border border-orange-500 rounded text-orange-400 hover:bg-orange-500/30 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear history confirmation dialog */}
      <ConfirmDialog
        isOpen={showClearHistoryConfirm}
        title="Clear History?"
        message="This will clear all undo/redo history. You will not be able to undo any previous changes after this action."
        confirmLabel="Clear History"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={confirmClearHistory}
        onCancel={() => setShowClearHistoryConfirm(false)}
      />

      {/* Leave confirmation dialog (for unsaved changes) */}
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
        variant="warning"
        onConfirm={confirmLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      />

      {/* Delete character confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteCharacterConfirm}
        title={editor.batchSelection.size > 0 ? "Delete Characters?" : "Delete Character?"}
        message={
          editor.batchSelection.size > 0
            ? `Are you sure you want to delete ${
                editor.batchSelection.size + 1
              } selected characters? This action cannot be undone.`
            : "Are you sure you want to delete this character? This action cannot be undone."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          const count = editor.batchSelection.size > 0 ? editor.batchSelection.size + 1 : 1;
          editor.deleteSelected();
          setShowDeleteCharacterConfirm(false);
          toast.success(count > 1 ? `${count} characters deleted` : "Character deleted");
        }}
        onCancel={() => setShowDeleteCharacterConfirm(false)}
      />
    </ToolLayout>
  );
}
