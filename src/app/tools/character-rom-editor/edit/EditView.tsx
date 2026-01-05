"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ToolLayout, ToolContent } from "@/components/layout/ToolLayout";
import { ToolbarItem } from "@/components/ui/ResponsiveToolbar";
import {
  EditorCanvas,
  EditorSidebar,
  ColorPresetSelector,
  KeyboardShortcutsHelp,
} from "@/components/character-editor";
import {
  useCharacterLibrary,
  useAutoSave,
  useKeyboardShortcuts,
  createEditorShortcuts,
} from "@/hooks/character-editor";
import { useCharacterEditor } from "@/hooks/character-editor/useCharacterEditor";
import {
  CharacterSet,
  getActiveColors,
  CustomColors,
  base64ToBinary,
  parseCharacterRom,
} from "@/lib/character-editor";

/**
 * Edit view for the Character ROM Editor
 */
export function EditView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { getById, save } = useCharacterLibrary();

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

  // Help modal state
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Auto-save
  const autoSave = useAutoSave({
    characterSetId: id,
    characters: editor.characters,
    config: editor.config,
    selectedIndex: editor.selectedIndex,
    isDirty: editor.isDirty,
    enabled: !!characterSet,
  });

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
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  }, [characterSet, editor, save, autoSave]);

  // Handle back navigation with unsaved changes warning
  const handleBack = useCallback(() => {
    if (editor.isDirty) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.push("/tools/character-rom-editor");
      }
    } else {
      router.push("/tools/character-rom-editor");
    }
  }, [editor.isDirty, router]);

  // Handle export
  const handleExport = useCallback(() => {
    if (id) {
      router.push(`/tools/character-rom-editor/export?id=${id}`);
    }
  }, [id, router]);

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
      }),
    [editor, handleSave]
  );

  useKeyboardShortcuts(shortcuts, { enabled: !showShortcutsHelp });

  // Toolbar actions with separators
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
    // Transform group - Rotate
    {
      id: "rotate-left",
      label: "Rotate Left",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      onClick: () => editor.rotateSelected("left"),
    },
    {
      id: "rotate-right",
      label: "Rotate Right",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" transform="scale(-1,1) translate(-24,0)" />
        </svg>
      ),
      onClick: () => editor.rotateSelected("right"),
    },
    // Transform group - Shift
    {
      id: "shift-up",
      label: "Shift Up",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      ),
      onClick: () => editor.shiftSelected("up"),
    },
    {
      id: "shift-down",
      label: "Shift Down",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ),
      onClick: () => editor.shiftSelected("down"),
    },
    {
      id: "shift-left",
      label: "Shift Left",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ),
      onClick: () => editor.shiftSelected("left"),
    },
    {
      id: "shift-right",
      label: "Shift Right",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      ),
      onClick: () => editor.shiftSelected("right"),
    },
    { type: "separator", id: "sep-2" },
    // Transform group - Flip/Invert
    {
      id: "flip-h",
      label: "Flip H",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8m-8 5h8M4 3v18m16-18v18" />
        </svg>
      ),
      onClick: editor.flipSelectedHorizontal,
    },
    {
      id: "flip-v",
      label: "Flip V",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v8M12 8v8m5-8v8M3 4h18M3 20h18" />
        </svg>
      ),
      onClick: editor.flipSelectedVertical,
    },
    {
      id: "invert",
      label: "Invert",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      onClick: editor.invertSelected,
    },
    { type: "separator", id: "sep-3" },
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
      id: "help",
      label: "Shortcuts",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => setShowShortcutsHelp(true),
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
      {/* Back button overlay */}
      <button
        onClick={handleBack}
        className="absolute top-[calc(var(--header-height)+var(--toolbar-height)+0.5rem)] left-4 z-30 flex items-center gap-1 text-xs text-gray-400 hover:text-retro-cyan transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
        {editor.isDirty && <span className="text-retro-pink">*</span>}
      </button>

      {/* Title overlay */}
      <div className="absolute top-[calc(var(--header-height)+var(--toolbar-height)+0.5rem)] left-1/2 -translate-x-1/2 z-30 text-sm text-gray-300">
        {characterSet?.metadata.name}
        {editor.isDirty && <span className="text-retro-pink ml-1">*</span>}
      </div>

      {/* Color preset selector */}
      <div className="absolute top-[calc(var(--header-height)+var(--toolbar-height)+0.5rem)] right-4 z-30">
        <ColorPresetSelector
          colors={colors}
          onColorsChange={setColors}
        />
      </div>

      <ToolContent
        sidebar={
          <EditorSidebar
            characters={editor.characters}
            config={editor.config}
            selectedIndex={editor.selectedIndex}
            batchSelection={editor.batchSelection}
            onSelect={editor.toggleBatchSelection}
            onAddCharacter={editor.addCharacter}
            onDeleteSelected={editor.deleteSelected}
            foregroundColor={colors.foreground}
            backgroundColor={colors.background}
          />
        }
        sidebarPosition="left"
        sidebarWidth="220px"
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
          onZoomChange={setZoom}
          characterIndex={editor.selectedIndex}
          totalCharacters={editor.characters.length}
        />
      </ToolContent>

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
    </ToolLayout>
  );
}
