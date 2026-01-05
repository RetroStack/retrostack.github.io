"use client";

import { useState, useCallback, useMemo } from "react";
import { KNOWN_MAKERS, getSystemsForMaker } from "@/lib/character-editor";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";

export interface LibraryFiltersProps {
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Available sizes for filtering */
  availableSizes: { width: number; height: number }[];
  /** Current width filters (multi-select) */
  widthFilters: number[];
  /** Current height filters (multi-select) */
  heightFilters: number[];
  /** Callback when size filters change */
  onSizeFilterChange: (widths: number[], heights: number[]) => void;
  /** Available makers from library */
  availableMakers?: string[];
  /** Available systems from library */
  availableSystems?: string[];
  /** Current maker filters (multi-select) */
  makerFilters?: string[];
  /** Current system filters (multi-select) */
  systemFilters?: string[];
  /** Callback when maker filters change */
  onMakerFilterChange?: (makers: string[]) => void;
  /** Callback when system filters change */
  onSystemFilterChange?: (systems: string[]) => void;
  /** Total count of items */
  totalCount: number;
  /** Filtered count of items */
  filteredCount: number;
}

/**
 * Filter controls for the character set library with multi-select support
 */
export function LibraryFilters({
  searchQuery,
  onSearchChange,
  availableSizes,
  widthFilters,
  heightFilters,
  onSizeFilterChange,
  availableMakers = [],
  availableSystems = [],
  makerFilters = [],
  systemFilters = [],
  onMakerFilterChange,
  onSystemFilterChange,
  totalCount,
  filteredCount,
}: LibraryFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Get all known makers for dropdown
  const allMakers = useMemo(() => {
    const known = KNOWN_MAKERS.map((m) => m.maker);
    // Include any available makers not in the known list
    const uniqueMakers = new Set([...known, ...availableMakers]);
    return Array.from(uniqueMakers).sort();
  }, [availableMakers]);

  // Get systems - show all if no maker selected, or filtered by selected makers
  const systemsForMakers = useMemo(() => {
    if (makerFilters.length === 0) {
      // If no maker selected, show all available systems
      return availableSystems.sort();
    }
    // Get systems for all selected makers
    const systems = new Set<string>();
    makerFilters.forEach((maker) => {
      const knownSystems = getSystemsForMaker(maker);
      knownSystems.forEach((s) => systems.add(s));
    });
    // Also include any available systems
    availableSystems.forEach((s) => systems.add(s));
    return Array.from(systems).sort();
  }, [makerFilters, availableSystems]);

  // Get unique widths and heights
  const availableWidths = useMemo(() => {
    return Array.from(new Set(availableSizes.map((s) => s.width))).sort((a, b) => a - b);
  }, [availableSizes]);

  const availableHeights = useMemo(() => {
    return Array.from(new Set(availableSizes.map((s) => s.height))).sort((a, b) => a - b);
  }, [availableSizes]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearchChange(localSearch);
    },
    [localSearch, onSearchChange]
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        onSearchChange(localSearch);
      }
    },
    [localSearch, onSearchChange]
  );

  const handleClearFilters = useCallback(() => {
    setLocalSearch("");
    onSearchChange("");
    onSizeFilterChange([], []);
    onMakerFilterChange?.([]);
    onSystemFilterChange?.([]);
  }, [onSearchChange, onSizeFilterChange, onMakerFilterChange, onSystemFilterChange]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    widthFilters.length > 0 ||
    heightFilters.length > 0 ||
    makerFilters.length > 0 ||
    systemFilters.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={() => onSearchChange(localSearch)}
            placeholder="Search character sets..."
            className="w-full px-4 py-2 pl-10 bg-retro-navy/50 border border-retro-grid/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50 transition-colors"
            aria-label="Search character sets"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Filter dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Width filter */}
        <MultiSelectDropdown
          label="Width"
          options={availableWidths.map((w) => ({ value: w, label: `${w}px` }))}
          selected={widthFilters}
          onChange={(widths) => onSizeFilterChange(widths, heightFilters)}
          placeholder="Width"
          allOptionLabel="Any width"
        />

        {/* Height filter */}
        <MultiSelectDropdown
          label="Height"
          options={availableHeights.map((h) => ({ value: h, label: `${h}px` }))}
          selected={heightFilters}
          onChange={(heights) => onSizeFilterChange(widthFilters, heights)}
          placeholder="Height"
          allOptionLabel="Any height"
        />

        {/* Maker filter */}
        {onMakerFilterChange && (
          <MultiSelectDropdown
            label="Maker"
            options={allMakers.map((m) => ({ value: m, label: m }))}
            selected={makerFilters}
            onChange={onMakerFilterChange}
            placeholder="Maker"
            allOptionLabel="Any maker"
          />
        )}

        {/* System filter */}
        {onSystemFilterChange && (
          <MultiSelectDropdown
            label="System"
            options={systemsForMakers.map((s) => ({ value: s, label: s }))}
            selected={systemFilters}
            onChange={onSystemFilterChange}
            placeholder="System"
            allOptionLabel="Any system"
          />
        )}
      </div>

      {/* Results count and clear button */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {hasActiveFilters
            ? `Showing ${filteredCount} of ${totalCount} character sets`
            : `${totalCount} character set${totalCount !== 1 ? "s" : ""}`}
        </span>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-retro-cyan hover:text-retro-pink transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact filter bar for smaller spaces
 */
export function LibraryFiltersCompact({
  searchQuery,
  onSearchChange,
  totalCount,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="w-full px-3 py-1.5 pl-8 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <span className="text-xs text-gray-500 whitespace-nowrap">
        {totalCount} items
      </span>
    </div>
  );
}
