"use client";

import { useMemo } from "react";
import { CharacterPreview } from "../character/CharacterPreview";
import { OverflowMenu } from "@/components/ui/OverflowMenu";
import { SerializedCharacterSet } from "@/lib/character-editor/types";
import { deserializeCharacterSet } from "@/lib/character-editor/import/binary";
import { formatSize } from "@/lib/character-editor/utils";

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
  /** Callback when edit metadata is clicked */
  onEditMetadata?: () => void;
  /** Callback when pin is toggled */
  onTogglePinned?: () => void;
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
  onEditMetadata,
  onTogglePinned,
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

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Build menu items
  const menuItems = useMemo(() => {
    const items = [];

    if (onTogglePinned) {
      items.push({
        id: "pin",
        label: metadata.isPinned ? "Unpin" : "Pin to top",
        onClick: onTogglePinned,
      });
    }

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

    if (onEditMetadata) {
      items.push({
        id: "edit-metadata",
        label: "Edit Metadata",
        onClick: onEditMetadata,
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
  }, [
    onEdit,
    onRename,
    onEditMetadata,
    onExport,
    onDuplicate,
    onDelete,
    onTogglePinned,
    metadata.isBuiltIn,
    metadata.isPinned,
  ]);

  return (
    <div
      className={`card-retro p-4 flex flex-col gap-3 hover-glow-cyan transition-all h-full relative has-[[aria-expanded=true]]:z-50 ${
        metadata.isPinned ? "ring-1 ring-retro-yellow/50" : ""
      }`}
    >
      {/* Header with title and menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-retro-cyan truncate flex items-center gap-1.5">
            {metadata.isPinned && (
              <svg className="w-3.5 h-3.5 text-retro-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
            {metadata.name}
          </h3>
          {(metadata.manufacturer || metadata.system || metadata.chip || metadata.locale) && (
            <p className="text-[10px] text-gray-500 mt-0.5">
              {metadata.manufacturer}
              {metadata.manufacturer && metadata.system ? " " : ""}
              {metadata.system}
              {metadata.chip && (metadata.manufacturer || metadata.system) ? " · " : ""}
              {metadata.chip}
              {metadata.locale && (metadata.manufacturer || metadata.system || metadata.chip) ? " · " : ""}
              {metadata.locale}
            </p>
          )}
          {metadata.description && <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{metadata.description}</p>}
        </div>

        <div className="flex-shrink-0">
          {menuItems.length > 0 && <OverflowMenu items={menuItems} align="right" label="Character set actions" />}
        </div>
      </div>

      {/* Character preview */}
      <div className="flex justify-center py-2 bg-black/30 rounded">
        <CharacterPreview characters={characters} config={config} maxCharacters={512} maxWidth={256} maxHeight={4096} />
      </div>

      {/* Footer with size, count, dates, and actions - pushed to bottom */}
      <div className="flex flex-col gap-2 pt-2 border-t border-retro-grid/30 text-[10px] mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Size badge */}
            <span className="px-1.5 py-0.5 bg-retro-purple/30 text-retro-pink rounded">{formatSize(config)}</span>

            {/* Character count */}
            <span className="text-gray-500">
              {characterCount} char{characterCount !== 1 ? "s" : ""}
            </span>

            {/* Built-in badge */}
            {metadata.isBuiltIn && <span className="px-1.5 py-0.5 bg-retro-navy text-gray-400 rounded">Built-in</span>}
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

        {/* Dates */}
        <div className="flex items-center justify-between text-gray-500">
          <span title="Date created">
            <span className="text-[8px] text-gray-600">Created:</span> {formatDate(metadata.createdAt)}
          </span>
          <span title="Date modified">
            <span className="text-[8px] text-gray-600">Modified:</span> {formatDate(metadata.updatedAt)}
          </span>
        </div>
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
        ${
          selected
            ? "border-retro-cyan bg-retro-cyan/10"
            : "border-retro-grid/30 bg-retro-navy/30 hover:border-retro-grid/50"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 bg-black/30 p-1 rounded">
          <CharacterPreview characters={characters} config={config} maxCharacters={8} maxWidth={48} maxHeight={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-200 truncate">{metadata.name}</div>
          <div className="text-[10px] text-gray-500">
            {formatSize(config)} - {characters.length} chars
          </div>
        </div>

        {selected && (
          <svg className="w-4 h-4 text-retro-cyan flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
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
export function LibraryCardEmpty({ onImport, onCreate }: { onImport?: () => void; onCreate?: () => void }) {
  return (
    <div className="card-retro p-6 flex flex-col items-center justify-center gap-4 border-dashed">
      <div className="w-12 h-12 rounded-full bg-retro-cyan/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-retro-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
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
            className="px-3 py-1.5 text-xs bg-retro-pink/20 text-retro-pink rounded hover:bg-retro-pink/30 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        )}
        {onImport && (
          <button
            onClick={onImport}
            className="px-3 py-1.5 text-xs bg-retro-cyan/20 text-retro-cyan rounded hover:bg-retro-cyan/30 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Import
          </button>
        )}
      </div>
    </div>
  );
}
