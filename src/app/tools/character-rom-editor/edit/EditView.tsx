"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ToolLayout, ToolContent } from "@/components/layout/ToolLayout";
import { ToolbarItem } from "@/components/ui/ResponsiveToolbar";
import {
  EditorCanvas,
  EditorSidebar,
  EditorHeader,
  EditorFooter,
  KeyboardShortcutsHelp,
  TransformToolbar,
  MetadataEditModal,
  ResizeModal,
  ImportCharactersModal,
  CopyCharacterModal,
  ReorderModal,
  ScaleModal,
  GoToCharacterModal,
  AsciiMapModal,
  TextPreviewModal,
  CharacterContextMenu,
  useContextMenu,
  SnapshotsModal,
  HistorySlider,
  ShareModal,
} from "@/components/character-editor";
import {
  useCharacterLibrary,
  useAutoSave,
  useKeyboardShortcuts,
  createEditorShortcuts,
  useSnapshots,
} from "@/hooks/character-editor";
import { useCharacterEditor } from "@/hooks/character-editor/useCharacterEditor";
import { CharacterSet, AnchorPoint } from "@/lib/character-editor/types";
import { getActiveColors, CustomColors } from "@/lib/character-editor/colorPresets";
import { base64ToBinary, parseCharacterRom } from "@/lib/character-editor/binary";
import { useToast } from "@/hooks/useToast";

/**
 * Edit view for the Character ROM Editor
 */
export function EditView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { getById, save, deleteSet } = useCharacterLibrary();
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

  // Save as dialog state
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [savingAs, setSavingAs] = useState(false);

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

  // Handle snapshot restore
  const handleSnapshotRestore = useCallback(
    (characters: import("@/lib/character-editor/types").Character[], snapshotName?: string) => {
      if (characterSet) {
        editor.reset({
          ...characterSet,
          characters,
        });
        toast.info(snapshotName ? `Restored: ${snapshotName}` : "Snapshot restored");
      }
    },
    [characterSet, editor, toast],
  );

  // Load character set
  useEffect(() => {
    async function loadCharacterSet() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle save
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
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        // User explicitly chose not to save, clear auto-save to prevent recovery dialog
        autoSave.clearAutoSave();
        router.push("/tools/character-rom-editor");
      }
    } else {
      router.push("/tools/character-rom-editor");
    }
  }, [editor.isDirty, router, autoSave]);

  // Handle export
  const handleExport = useCallback(() => {
    if (id) {
      router.push(`/tools/character-rom-editor/export?id=${id}`);
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
      } catch (e) {
        console.error("Failed to recover:", e);
        autoSave.discard();
      }
    }
  }, [autoSave, characterSet, editor]);

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
        deleteSelected: editor.deleteSelected,
        addCharacter: editor.addCharacter,
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
        // Toolbar actions
        exportSet: handleExport,
        importSet: () => setShowImportModal(true),
        shareSet: () => setShowShare(true),
        saveAs: openSaveAsDialog,
        editMetadata: () => setShowMetadataModal(true),
        resetChanges: handleReset,
        reorderCharacters: () => setShowReorderModal(true),
      }),
    [editor, handleSave, handleExport, handleReset, openSaveAsDialog, navigatePrev, navigateNext, navigatePageUp, navigatePageDown, navigateFirst, navigateLast],
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
          editor.deleteSelected();
          toast.success(isMultiSelect ? `${selectedCount} characters deleted` : "Character deleted");
        },
        danger: true,
      },
    ];
  }, [contextMenu, editor, toast]);

  // Toolbar actions - reorganized into logical groups
  // Priority: 3 = essential (always visible), 2 = important, 1 = normal, 0 = low (first to hide)
  const toolbarActions: ToolbarItem[] = [
    // Group 1: Character set file operations
    {
      id: "add-char",
      label: "Add Char",
      tooltip: "Add a new character to the set",
      shortcut: "Ctrl+N",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          {/* Letter A */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 17l3.5-10h3L17 17M8.5 13h7"
          />
          {/* Plus sign */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M19 4v4m-2-2h4"
          />
        </svg>
      ),
      onClick: editor.addCharacter,
      priority: 2,
    },
    {
      id: "save",
      label: saving ? "Saving..." : "Save Set",
      tooltip: "Save character set to browser storage",
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
      disabled: saving || !editor.isDirty,
      active: editor.isDirty,
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M18 8v4m-2-2h4"
          />
          {/* Center label */}
          <rect x="8" y="12" width="8" height="6" rx="1" strokeWidth={2} />
        </svg>
      ),
      onClick: openSaveAsDialog,
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 6v14a2 2 0 002 2h8a2 2 0 002-2V6"
          />
          {/* Lines inside */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 10v8M14 10v8" />
        </svg>
      ),
      onClick: () => setShowDeleteConfirm(true),
      disabled: characterSet?.metadata.isBuiltIn,
      priority: 1,
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
    // Group 3: Editing tools
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
      id: "import",
      label: "Import Chars",
      tooltip: "Import characters from ROM file or image",
      shortcut: "Ctrl+I",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          {/* Letter A representing character */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 20l2.5-7h3L16 20M9.25 16h5.5"
          />
          {/* Arrow pointing down */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v8m0 0l-3-3m3 3l3-3"
          />
        </svg>
      ),
      onClick: () => setShowImportModal(true),
      priority: 1,
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
    { type: "separator", id: "sep-3" },
    // Group 4: Export/Share
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
    { type: "separator", id: "sep-4" },
    // Group 5: History/Snapshots
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
    },
    { type: "separator", id: "sep-5" },
    // Group 6: Navigation/View
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
    {
      id: "text-preview",
      label: "Preview",
      tooltip: "Preview text rendered with this character set",
      shortcut: "T",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      ),
      onClick: () => setShowTextPreview(true),
      priority: 0,
    },
    { type: "separator", id: "sep-6" },
    // Group 7: Help
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
          isDirty={editor.isDirty}
          characterIndex={editor.selectedIndex}
          totalCharacters={editor.characters.length}
          batchMode={isBatchMode}
          zoom={zoom}
          onZoomChange={setZoom}
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
                onDeleteSelected={editor.deleteSelected}
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
                onDelete={editor.deleteSelected}
                onCopy={() => setShowCopyModal(true)}
                disabled={!selectedCharacter}
                className="h-full"
              />
            }
            rightSidebarWidth="120px"
            rightSidebarCollapsible={false}
          >
            <EditorCanvas
              character={selectedCharacter}
              config={editor.config}
              onPixelToggle={editor.toggleSelectedPixel}
              onPixelSet={editor.setSelectedPixel}
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
            />
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
        />

        {/* Keyboard shortcuts footer */}
        <EditorFooter hoverCoords={hoverCoords} />
      </div>

      {/* Recovery dialog */}
      {autoSave.hasRecoveryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl p-6">
            <h2 className="text-lg font-medium text-white mb-2">Recover Unsaved Changes?</h2>
            <p className="text-sm text-gray-400 mb-4">
              We found unsaved changes from a previous session. Would you like to recover them?
            </p>
            <div className="text-xs text-gray-500 mb-6">
              Last saved: {autoSave.recoveryData && new Date(autoSave.recoveryData.timestamp).toLocaleString()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={autoSave.discard}
                className="flex-1 px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleRecover}
                className="flex-1 px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors"
              >
                Recover
              </button>
            </div>
          </div>
        </div>
      )}

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
        onDelete={snapshots.remove}
        onRename={snapshots.rename}
        onRestoreApply={handleSnapshotRestore}
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
    </ToolLayout>
  );
}
