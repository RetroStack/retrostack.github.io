"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CharacterPreview } from "./CharacterPreview";
import { OverflowMenu } from "@/components/ui/OverflowMenu";
import {
  SerializedCharacterSet,
  deserializeCharacterSet,
  formatSize,
} from "@/lib/character-editor";

export interface LibraryCardProps {
  /** Serialized character set data */
  characterSet: SerializedCharacterSet;
  /** Callback when edit is clicked */
  onEdit?: () => void;
  /** Callback when export is clicked */
  onExport?: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Callback when duplicate is clicked */
  onDuplicate?: () => void;
  /** Callback when rename is clicked */
  onRename?: () => void;
}

/**
 * Card component for displaying a character set in the library grid
 */
export function LibraryCard({
  characterSet,
  onEdit,
  onExport,
  onDelete,
  onDuplicate,
  onRename,
}: LibraryCardProps) {
  const { metadata, config } = characterSet;

  // Deserialize for preview
  const characters = useMemo(() => {
    try {
      const deserialized = deserializeCharacterSet(characterSet);
      return deserialized.characters;
    } catch {
      return [];
    }
  }, [characterSet]);

  const characterCount = characters.length;

  // Build menu items
  const menuItems = useMemo(() => {
    const items = [];

    if (onEdit) {
      items.push({
        id: "edit",
        label: "Edit",
        onClick: onEdit,
      });
    }

    if (onRename && !metadata.isBuiltIn) {
      items.push({
        id: "rename",
        label: "Rename",
        onClick: onRename,
      });
    }

    if (onExport) {
      items.push({
        id: "export",
        label: "Export",
        onClick: onExport,
      });
    }

    if (onDuplicate) {
      items.push({
        id: "duplicate",
        label: "Duplicate",
        onClick: onDuplicate,
      });
    }

    if (onDelete && !metadata.isBuiltIn) {
      items.push({
        id: "delete",
        label: "Delete",
        onClick: onDelete,
        variant: "danger" as const,
      });
    }

    return items;
  }, [onEdit, onRename, onExport, onDuplicate, onDelete, metadata.isBuiltIn]);

  return (
    <div className="card-retro p-4 flex flex-col gap-3 hover-glow-cyan transition-all">
      {/* Header with title and menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-retro-cyan truncate">
            {metadata.name}
          </h3>
          {(metadata.maker || metadata.system) && (
            <p className="text-[10px] text-gray-500 mt-0.5">
              {metadata.maker}{metadata.maker && metadata.system ? " " : ""}{metadata.system}
            </p>
          )}
          {metadata.description && (
            <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
              {metadata.description}
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          {menuItems.length > 0 && (
            <OverflowMenu items={menuItems} align="right" label="Character set actions" />
          )}
        </div>
      </div>

      {/* Character preview */}
      <div className="flex justify-center py-2 bg-black/30 rounded">
        <CharacterPreview
          characters={characters}
          config={config}
          maxCharacters={512}
          maxWidth={256}
          maxHeight={4096}
        />
      </div>

      {/* Footer with size, count, and actions */}
      <div className="flex items-center justify-between pt-2 border-t border-retro-grid/30 text-[10px]">
        <div className="flex items-center gap-2">
          {/* Size badge */}
          <span className="px-1.5 py-0.5 bg-retro-purple/30 text-retro-pink rounded">
            {formatSize(config)}
          </span>

          {/* Character count */}
          <span className="text-gray-500">
            {characterCount} char{characterCount !== 1 ? "s" : ""}
          </span>

          {/* Built-in badge */}
          {metadata.isBuiltIn && (
            <span className="px-1.5 py-0.5 bg-retro-navy text-gray-400 rounded">
              Built-in
            </span>
          )}
        </div>

        {/* Quick action button */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-2 py-1 text-xs bg-retro-cyan/20 text-retro-cyan rounded hover:bg-retro-cyan/30 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact card for selection dialogs
 */
export function LibraryCardCompact({
  characterSet,
  selected = false,
  onClick,
}: {
  characterSet: SerializedCharacterSet;
  selected?: boolean;
  onClick?: () => void;
}) {
  const { metadata, config } = characterSet;

  const characters = useMemo(() => {
    try {
      const deserialized = deserializeCharacterSet(characterSet);
      return deserialized.characters;
    } catch {
      return [];
    }
  }, [characterSet]);

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-3 rounded border text-left transition-all
        ${selected
          ? "border-retro-cyan bg-retro-cyan/10"
          : "border-retro-grid/30 bg-retro-navy/30 hover:border-retro-grid/50"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 bg-black/30 p-1 rounded">
          <CharacterPreview
            characters={characters}
            config={config}
            maxCharacters={8}
            maxWidth={48}
            maxHeight={24}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-200 truncate">
            {metadata.name}
          </div>
          <div className="text-[10px] text-gray-500">
            {formatSize(config)} - {characters.length} chars
          </div>
        </div>

        {selected && (
          <svg
            className="w-4 h-4 text-retro-cyan flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        )}
      </div>
    </button>
  );
}

/**
 * Empty state card for adding new character sets
 */
export function LibraryCardEmpty({
  onImport,
  onCreate,
}: {
  onImport?: () => void;
  onCreate?: () => void;
}) {
  return (
    <div className="card-retro p-6 flex flex-col items-center justify-center gap-4 border-dashed">
      <div className="w-12 h-12 rounded-full bg-retro-purple/20 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-retro-pink"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-300">Add a character set</p>
        <p className="text-xs text-gray-500 mt-1">Import a ROM file or create from scratch</p>
      </div>

      <div className="flex gap-2">
        {onCreate && (
          <button
            onClick={onCreate}
            className="px-3 py-1.5 text-xs bg-retro-pink/20 text-retro-pink rounded hover:bg-retro-pink/30 transition-colors"
          >
            Add
          </button>
        )}
        {onImport && (
          <button
            onClick={onImport}
            className="px-3 py-1.5 text-xs bg-retro-cyan/20 text-retro-cyan rounded hover:bg-retro-cyan/30 transition-colors"
          >
            Import
          </button>
        )}
      </div>
    </div>
  );
}
