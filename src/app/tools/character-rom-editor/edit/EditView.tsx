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
  ChangeLogModal,
  ShareModal,
} from "@/components/character-editor";
import {
  useCharacterLibrary,
  useAutoSave,
  useKeyboardShortcuts,
  createEditorShortcuts,
  useSnapshots,
  useChangeLog,
} from "@/hooks/character-editor";
import { useCharacterEditor } from "@/hooks/character-editor/useCharacterEditor";
import {
  CharacterSet,
  getActiveColors,
  CustomColors,
  base64ToBinary,
  parseCharacterRom,
  AnchorPoint,
} from "@/lib/character-editor";
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
  const [showChangeLog, setShowChangeLog] = useState(false);
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

  // Change log
  const changeLog = useChangeLog({
    maxEntries: 100,
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
    [snapshots, editor.characters, editor.config, toast]
  );

  // Handle snapshot restore
  const handleSnapshotRestore = useCallback(
    (characters: import("@/lib/character-editor").Character[]) => {
      if (characterSet) {
        editor.reset({
          ...characterSet,
          characters,
        });
        toast.info("Snapshot restored");
      }
    },
    [characterSet, editor, toast]
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
    [editor]
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
    [characterSet, save, toast]
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
      }),
    [editor, handleSave, navigatePrev, navigateNext, navigatePageUp, navigatePageDown, navigateFirst, navigateLast]
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
        onClick: () => editor.invertSelected(),
      },
      {
        label: "Clear",
        onClick: () => editor.clearSelected(),
      },
      {
        label: "Fill",
        onClick: () => editor.fillSelected(),
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

  // Toolbar actions - simplified (transforms moved to right sidebar)
  // Order: Undo, Redo, [sep], Save, Save As, Delete, [sep], Edit Info, Resize, Export, Reset, [sep], Shortcuts
  const toolbarActions: ToolbarItem[] = [
    // Undo/Redo group
    {
      id: "undo",
      label: "Undo",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      onClick: editor.undo,
      disabled: !editor.canUndo,
    },
    {
      id: "redo",
      label: "Redo",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      ),
      onClick: editor.redo,
      disabled: !editor.canRedo,
    },
    { type: "separator", id: "sep-1" },
    // File operations group
    {
      id: "save",
      label: saving ? "Saving..." : "Save",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      ),
      onClick: handleSave,
      disabled: saving || !editor.isDirty,
      active: editor.isDirty,
    },
    {
      id: "save-as",
      label: "Save As",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m0 0V4m0 0H9m3 0v3" />
        </svg>
      ),
      onClick: openSaveAsDialog,
    },
    {
      id: "delete",
      label: "Delete",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: () => setShowDeleteConfirm(true),
      disabled: characterSet?.metadata.isBuiltIn,
    },
    { type: "separator", id: "sep-2" },
    {
      id: "edit-metadata",
      label: "Edit Info",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: () => setShowMetadataModal(true),
    },
    {
      id: "resize",
      label: "Resize",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      ),
      onClick: () => setShowResizeModal(true),
    },
    {
      id: "import",
      label: "Import",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      onClick: () => setShowImportModal(true),
    },
    {
      id: "reorder",
      label: "Reorder",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      onClick: () => setShowReorderModal(true),
    },
    {
      id: "export",
      label: "Export",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: handleExport,
    },
    {
      id: "share",
      label: "Share",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
      onClick: () => setShowShare(true),
    },
    {
      id: "reset",
      label: "Reset",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      onClick: handleReset,
      disabled: !editor.isDirty,
    },
    {
      id: "snapshots",
      label: `Snapshots (${snapshots.snapshots.length})`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      onClick: () => setShowSnapshots(true),
    },
    {
      id: "changelog",
      label: `Log (${changeLog.count})`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      onClick: () => setShowChangeLog(true),
    },
    { type: "separator", id: "sep-3" },
    {
      id: "help",
      label: "Shortcuts (?)",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => setShowShortcutsHelp(true),
    },
    { type: "separator", id: "sep-4" },
    {
      id: "bug-report",
      label: "Report Bug",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      onClick: () => window.open("https://github.com/RetroStack/retrostack-web/issues", "_blank"),
    },
    {
      id: "github",
      label: "GitHub",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
      ),
      onClick: () => window.open("https://github.com/RetroStack/retrostack-web", "_blank"),
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
          <svg
            className="w-16 h-16 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
    <ToolLayout
      title={characterSet?.metadata.name || "Character Editor"}
      toolbar={toolbarActions}
    >
      {/* Consolidated editor header */}
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
        hoverCoords={hoverCoords}
      />

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
            onShift={(direction) => editor.shiftSelected(direction)}
            onRotate={(direction) => editor.rotateSelected(direction)}
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
        rightSidebarWidth="80px"
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
          maxZoom={40}
          onZoomChange={setZoom}
          onPixelHover={(row, col) => setHoverCoords({ x: col, y: row })}
          onPixelLeave={() => setHoverCoords(null)}
        />
      </ToolContent>

      {/* Keyboard shortcuts footer */}
      <EditorFooter />

      {/* Recovery dialog */}
      {autoSave.hasRecoveryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl p-6">
            <h2 className="text-lg font-medium text-white mb-2">
              Recover Unsaved Changes?
            </h2>
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
        onImport={editor.addCharacters}
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
        onReorder={editor.setCharacters}
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
        foregroundColor={colors.foreground}
        backgroundColor={colors.background}
      />

      {/* Snapshots modal */}
      <SnapshotsModal
        isOpen={showSnapshots}
        onClose={() => setShowSnapshots(false)}
        snapshots={snapshots.snapshots}
        loading={snapshots.loading}
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

      {/* Change log modal */}
      <ChangeLogModal
        isOpen={showChangeLog}
        onClose={() => setShowChangeLog(false)}
        entries={changeLog.entries}
        onClear={changeLog.clear}
        onExport={changeLog.exportAsText}
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
        <CharacterContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={hideContextMenu}
        />
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
              This will discard all unsaved changes and restore &quot;{characterSet?.metadata.name}&quot; to its last saved state. This action cannot be undone.
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
