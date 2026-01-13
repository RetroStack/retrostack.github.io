/**
 * Editor Sidebar Component
 *
 * Character selection panel for the editor with two view modes:
 * - Grid view: Full character grid with shift-click multi-select
 * - Overview view: Compact canvas overview with long-press selection
 *
 * Features:
 * - Toggle between grid and overview views
 * - Touch-friendly selection mode with floating action bar
 * - Add new character button
 * - Context menu support
 * - Batch selection with select all/none
 *
 * @module components/character-editor/editor/EditorSidebar
 */
"use client";

import { useCallback, useState } from "react";
import { InteractiveCharacterGrid } from "../character/CharacterGrid";
import { CharacterSetOverview } from "../character/CharacterSetOverview";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import { useSelectionMode } from "@/hooks/character-editor/useSelectionMode";
import { SelectionModeBar } from "@/components/ui/SelectionModeBar";

export interface EditorSidebarProps {
  /** Array of characters */
  characters: Character[];
  /** Character set configuration */
  config: CharacterSetConfig;
  /** Currently selected character index */
  selectedIndex: number;
  /** Batch selected character indices */
  batchSelection: Set<number>;
  /** Callback when selection changes */
  onSelect: (index: number, shiftKey: boolean, metaOrCtrlKey?: boolean) => void;
  /** Callback to add a new character */
  onAddCharacter?: () => void;
  /** Callback to delete selected character(s) */
  onDeleteSelected?: () => void;
  /** Callback to select all characters */
  onSelectAll?: () => void;
  /** Callback to clear batch selection */
  onSelectNone?: () => void;
  /** Callback for right-click context menu */
  onContextMenu?: (x: number, y: number, index: number) => void;
  /** Whether to show add button */
  showAddButton?: boolean;
  /** Foreground color */
  foregroundColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sidebar component for character selection in the editor
 */
export function EditorSidebar({
  characters,
  config,
  selectedIndex,
  batchSelection,
  onSelect,
  onAddCharacter,
  onDeleteSelected,
  onSelectAll: _onSelectAll,
  onSelectNone: _onSelectNone,
  onContextMenu,
  showAddButton = true,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  className = "",
}: EditorSidebarProps) {
  // These props are part of the interface but not used in this component
  void _onSelectAll;
  void _onSelectNone;

  const totalSelected = batchSelection.size + 1;
  const hasMultipleSelected = totalSelected > 1;
  const [gridCollapsed, setGridCollapsed] = useState(false);

  // Selection mode hook for touch-friendly multi-select
  const selectionMode = useSelectionMode({
    itemCount: characters.length,
    selectedIndex,
    batchSelection,
    onSelect,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const charCount = characters.length;
      if (charCount === 0) return;

      switch (e.key) {
        case "ArrowUp":
        case "ArrowLeft": {
          e.preventDefault();
          const newIndex = selectedIndex > 0 ? selectedIndex - 1 : charCount - 1;
          onSelect(newIndex, e.shiftKey, e.metaKey || e.ctrlKey);
          break;
        }
        case "ArrowDown":
        case "ArrowRight": {
          e.preventDefault();
          const newIndex = selectedIndex < charCount - 1 ? selectedIndex + 1 : 0;
          onSelect(newIndex, e.shiftKey, e.metaKey || e.ctrlKey);
          break;
        }
        case "Delete":
        case "Backspace": {
          e.preventDefault();
          onDeleteSelected?.();
          break;
        }
        case "a":
        case "A": {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Select all - handled by parent
          }
          break;
        }
      }
    },
    [characters.length, selectedIndex, onSelect, onDeleteSelected],
  );

  return (
    <div data-testid="editor-sidebar" className={`flex flex-col relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="p-3 border-b border-retro-grid/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">Characters</span>
            <span className="text-xs text-gray-500">({characters.length})</span>
          </div>
          {/* Selection mode toggle button */}
          <button
            onClick={selectionMode.toggleSelectionMode}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              selectionMode.isSelectionMode
                ? "bg-retro-cyan/20 text-retro-cyan"
                : "text-gray-400 hover:text-retro-cyan hover:bg-retro-cyan/10"
            }`}
            title={selectionMode.isSelectionMode ? "Exit selection mode" : "Enter selection mode"}
          >
            {selectionMode.isSelectionMode ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            )}
            <span className="hidden sm:inline">Select</span>
          </button>
        </div>
        {hasMultipleSelected && !selectionMode.isSelectionMode && (
          <div className="mt-1 text-xs text-retro-pink">{totalSelected} characters selected</div>
        )}
      </div>

      {/* Content area - scrolling handled by parent */}
      <div>
        {/* Character set overview - collapsible */}
        <div className="border-b border-retro-grid/30">
          <CharacterSetOverview
            characters={characters}
            config={config}
            selectedIndex={selectedIndex}
            batchSelection={batchSelection}
            onSelect={(index) => selectionMode.handleItemInteraction(index, false, false)}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            maxWidth={200}
            pixelScale={1}
            collapsible
            defaultCollapsed={false}
            isSelectionMode={selectionMode.isSelectionMode}
            onLongPress={selectionMode.handleLongPress}
            onToggleSelection={selectionMode.toggleItem}
          />
        </div>

        {/* Character grid - collapsible, improved density */}
        <div className="border-b border-retro-grid/30">
          <div className="flex items-center justify-between p-2">
            <span className="font-medium text-sm text-gray-300">Characters</span>
            <button
              onClick={() => setGridCollapsed(!gridCollapsed)}
              className="p-1 text-gray-400 hover:text-retro-cyan transition-colors"
              aria-label={gridCollapsed ? "Expand characters" : "Collapse characters"}
            >
              <svg
                className={`w-4 h-4 transition-transform ${gridCollapsed ? "" : "rotate-180"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {!gridCollapsed && (
            <div className="p-2 pb-14">
              <InteractiveCharacterGrid
                characters={characters}
                config={config}
                selectedIndex={selectedIndex}
                batchSelection={batchSelection}
                onSelect={selectionMode.handleItemInteraction}
                showAddButton={showAddButton && !!onAddCharacter && !selectionMode.isSelectionMode}
                onAdd={onAddCharacter}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                showIndices={false}
                smallScale={2}
                minColumns={8}
                maxColumns={10}
                gap={4}
                onContextMenu={selectionMode.isSelectionMode ? undefined : onContextMenu}
                isSelectionMode={selectionMode.isSelectionMode}
                onLongPress={selectionMode.handleLongPress}
              />
            </div>
          )}
        </div>
      </div>

      {/* Selection mode action bar */}
      <SelectionModeBar
        isVisible={selectionMode.isSelectionMode}
        selectionCount={selectionMode.selectionCount}
        totalItems={characters.length}
        onSelectAll={selectionMode.selectAll}
        onClearSelection={selectionMode.clearSelection}
        onExitMode={selectionMode.exitSelectionMode}
        fixed
      />
    </div>
  );
}
