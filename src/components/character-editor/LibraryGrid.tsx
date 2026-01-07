"use client";

import { LibraryCard, LibraryCardEmpty } from "./LibraryCard";
import { SerializedCharacterSet } from "@/lib/character-editor/types";

export interface LibraryGridProps {
  /** Character sets to display */
  characterSets: SerializedCharacterSet[];
  /** Loading state */
  loading?: boolean;
  /** Callback when edit is clicked */
  onEdit?: (id: string) => void;
  /** Callback when export is clicked */
  onExport?: (id: string) => void;
  /** Callback when delete is clicked */
  onDelete?: (id: string) => void;
  /** Callback when duplicate is clicked */
  onDuplicate?: (id: string) => void;
  /** Callback when rename is clicked */
  onRename?: (id: string) => void;
  /** Callback when pin is toggled */
  onTogglePinned?: (id: string) => void;
  /** Callback when import is clicked (empty state) */
  onImport?: () => void;
  /** Callback when create is clicked (empty state) */
  onCreate?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Grid layout for character set library cards
 */
export function LibraryGrid({
  characterSets,
  loading = false,
  onEdit,
  onExport,
  onDelete,
  onDuplicate,
  onRename,
  onTogglePinned,
  onImport,
  onCreate,
  className = "",
}: LibraryGridProps) {
  if (loading) {
    return (
      <div className={`grid-fluid gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <LibraryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (characterSets.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <LibraryCardEmpty onImport={onImport} onCreate={onCreate} />
      </div>
    );
  }

  return (
    <div className={`grid-fluid gap-4 ${className}`}>
      {characterSets.map((characterSet) => (
        <LibraryCard
          key={characterSet.metadata.id}
          characterSet={characterSet}
          onEdit={onEdit ? () => onEdit(characterSet.metadata.id) : undefined}
          onExport={onExport ? () => onExport(characterSet.metadata.id) : undefined}
          onDelete={onDelete ? () => onDelete(characterSet.metadata.id) : undefined}
          onDuplicate={onDuplicate ? () => onDuplicate(characterSet.metadata.id) : undefined}
          onRename={onRename ? () => onRename(characterSet.metadata.id) : undefined}
          onTogglePinned={onTogglePinned ? () => onTogglePinned(characterSet.metadata.id) : undefined}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton loading card
 */
function LibraryCardSkeleton() {
  return (
    <div className="card-retro p-4 animate-pulse">
      {/* Title skeleton */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="h-4 bg-retro-grid/30 rounded w-3/4" />
          <div className="h-3 bg-retro-grid/20 rounded w-full mt-2" />
        </div>
        <div className="w-6 h-6 bg-retro-grid/20 rounded" />
      </div>

      {/* Preview skeleton */}
      <div className="h-16 bg-black/30 rounded mb-3" />

      {/* Metadata skeleton */}
      <div className="flex gap-2 mb-3">
        <div className="h-4 w-12 bg-retro-grid/20 rounded" />
        <div className="h-4 w-16 bg-retro-grid/20 rounded" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-2 border-t border-retro-grid/30">
        <div className="h-3 w-20 bg-retro-grid/20 rounded" />
        <div className="flex gap-1">
          <div className="h-6 w-12 bg-retro-grid/20 rounded" />
          <div className="h-6 w-14 bg-retro-grid/20 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state for filtered results
 */
export function LibraryGridEmptyResults({
  onClearFilters,
}: {
  onClearFilters?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-retro-navy/50 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-medium text-gray-300 mb-2">No results found</h3>
      <p className="text-sm text-gray-500 mb-4">
        Try adjusting your search or filters
      </p>

      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm bg-retro-cyan/20 text-retro-cyan rounded hover:bg-retro-cyan/30 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

/**
 * Error state for library loading
 */
export function LibraryGridError({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-400"
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
      </div>

      <h3 className="text-lg font-medium text-red-400 mb-2">Failed to load library</h3>
      <p className="text-sm text-gray-500 mb-4">{error}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-retro-cyan/20 text-retro-cyan rounded hover:bg-retro-cyan/30 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
