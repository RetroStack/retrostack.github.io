"use client";

import { useCallback, useState } from "react";
import { InteractiveCharacterGrid } from "./CharacterGrid";
import { CharacterSetOverview } from "./CharacterSetOverview";
import { Character, CharacterSetConfig } from "@/lib/character-editor";

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
  onSelectAll,
  onSelectNone,
  showAddButton = true,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  className = "",
}: EditorSidebarProps) {
  const totalSelected = batchSelection.size + 1;
  const hasMultipleSelected = totalSelected > 1;
  const [gridCollapsed, setGridCollapsed] = useState(false);

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
    <div className={`flex flex-col h-full overflow-hidden ${className}`} onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-retro-grid/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">Characters</span>
            <span className="text-xs text-gray-500">({characters.length})</span>
          </div>
        </div>
        {hasMultipleSelected && (
          <div className="mt-1 text-xs text-retro-pink">{totalSelected} characters selected</div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Character set overview - collapsible */}
        <div className="border-b border-retro-grid/30">
          <CharacterSetOverview
            characters={characters}
            config={config}
            selectedIndex={selectedIndex}
            batchSelection={batchSelection}
            onSelect={(index) => onSelect(index, false)}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            maxWidth={200}
            pixelScale={1}
            collapsible
            defaultCollapsed={false}
          />
        </div>

        {/* Character grid - collapsible, improved density */}
        <div className="border-b border-retro-grid/30">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-300">Characters</span>
              {onSelectAll && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAll();
                  }}
                  className="text-[10px] text-gray-500 hover:text-retro-cyan transition-colors"
                >
                  All
                </button>
              )}
              {onSelectNone && hasMultipleSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNone();
                  }}
                  className="text-[10px] text-gray-500 hover:text-retro-pink transition-colors"
                >
                  None
                </button>
              )}
            </div>
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
            <div className="p-2">
              <InteractiveCharacterGrid
                characters={characters}
                config={config}
                selectedIndex={selectedIndex}
                batchSelection={batchSelection}
                onSelect={onSelect}
                showAddButton={showAddButton && !!onAddCharacter}
                onAdd={onAddCharacter}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                showIndices={false}
                smallScale={2}
                minColumns={8}
                maxColumns={10}
                gap={4}
                className="max-h-[400px] overflow-y-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
