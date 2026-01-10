/**
 * Library Filters Components
 *
 * Filter and sort controls for the character set library.
 * Components:
 * - LibraryFilters: Full filter bar with search, sort, and multi-select filters
 * - LibraryFiltersCompact: Minimal search-only version for small spaces
 *
 * Filter options:
 * - Search by name/description
 * - Width and height dimension filters
 * - Character count filter
 * - Manufacturer, system, chip, locale metadata filters
 * - Sort by various fields (date, name, size, etc.)
 * - Sort direction toggle (ascending/descending)
 *
 * @module components/character-editor/library/LibraryFilters
 */
"use client";

import { useCallback, useMemo } from "react";
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import {
  PAGE_SIZE_OPTIONS,
  type PageSize,
  type PaginatedResult,
} from "@/lib/character-editor/library/filters";

export type SortField =
  | "name"
  | "description"
  | "source"
  | "updatedAt"
  | "createdAt"
  | "width"
  | "height"
  | "size"
  | "characters"
  | "manufacturer"
  | "system"
  | "chip"
  | "locale";
export type SortDirection = "asc" | "desc";

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "updatedAt", label: "Date Modified" },
  { value: "createdAt", label: "Date Created" },
  { value: "name", label: "Name" },
  { value: "description", label: "Description" },
  { value: "source", label: "Source" },
  { value: "width", label: "Width" },
  { value: "height", label: "Height" },
  { value: "size", label: "Size (W×H)" },
  { value: "characters", label: "Count" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "system", label: "System" },
  { value: "chip", label: "Chip" },
  { value: "locale", label: "Locale" },
];

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
  /** Available character counts from library */
  availableCharacterCounts?: number[];
  /** Current character count filters (multi-select) */
  characterCountFilters?: number[];
  /** Callback when character count filters change */
  onCharacterCountFilterChange?: (counts: number[]) => void;
  /** Available manufacturers from library */
  availableManufacturers?: string[];
  /** Available systems from library */
  availableSystems?: string[];
  /** Current manufacturer filters (multi-select) */
  manufacturerFilters?: string[];
  /** Current system filters (multi-select) */
  systemFilters?: string[];
  /** Callback when manufacturer filters change */
  onManufacturerFilterChange?: (manufacturers: string[]) => void;
  /** Callback when system filters change */
  onSystemFilterChange?: (systems: string[]) => void;
  /** Available chips from library */
  availableChips?: string[];
  /** Current chip filters (multi-select) */
  chipFilters?: string[];
  /** Callback when chip filters change */
  onChipFilterChange?: (chips: string[]) => void;
  /** Available locales from library */
  availableLocales?: string[];
  /** Current locale filters (multi-select) */
  localeFilters?: string[];
  /** Callback when locale filters change */
  onLocaleFilterChange?: (locales: string[]) => void;
  /** Current sort field */
  sortField?: SortField;
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Callback when sort field changes */
  onSortFieldChange?: (field: SortField) => void;
  /** Callback when sort direction is toggled */
  onSortDirectionToggle?: () => void;
  /** Total count of items */
  totalCount: number;
  /** Filtered count of items */
  filteredCount: number;
  /** Pagination state (optional - only shown when provided) */
  pagination?: PaginatedResult<unknown>;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: PageSize) => void;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
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
  availableCharacterCounts = [],
  characterCountFilters = [],
  onCharacterCountFilterChange,
  availableManufacturers = [],
  availableSystems = [],
  manufacturerFilters = [],
  systemFilters = [],
  onManufacturerFilterChange,
  onSystemFilterChange,
  availableChips = [],
  chipFilters = [],
  onChipFilterChange,
  availableLocales = [],
  localeFilters = [],
  onLocaleFilterChange,
  sortField = "updatedAt",
  sortDirection = "desc",
  onSortFieldChange,
  onSortDirectionToggle,
  totalCount,
  filteredCount,
  pagination,
  onPageSizeChange,
  onPageChange,
}: LibraryFiltersProps) {
  // Get all manufacturers from the library
  const allManufacturers = useMemo(() => {
    return [...availableManufacturers].sort();
  }, [availableManufacturers]);

  // Get systems from the library - show all if no manufacturer selected
  const systemsForManufacturers = useMemo(() => {
    return [...availableSystems].sort();
  }, [availableSystems]);

  // Get unique widths and heights
  const availableWidths = useMemo(() => {
    return Array.from(new Set(availableSizes.map((s) => s.width))).sort((a, b) => a - b);
  }, [availableSizes]);

  const availableHeights = useMemo(() => {
    return Array.from(new Set(availableSizes.map((s) => s.height))).sort((a, b) => a - b);
  }, [availableSizes]);

  const handleClearFilters = useCallback(() => {
    onSearchChange("");
    onSizeFilterChange([], []);
    onCharacterCountFilterChange?.([]);
    onManufacturerFilterChange?.([]);
    onSystemFilterChange?.([]);
    onChipFilterChange?.([]);
    onLocaleFilterChange?.([]);
  }, [
    onSearchChange,
    onSizeFilterChange,
    onCharacterCountFilterChange,
    onManufacturerFilterChange,
    onSystemFilterChange,
    onChipFilterChange,
    onLocaleFilterChange,
  ]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    widthFilters.length > 0 ||
    heightFilters.length > 0 ||
    characterCountFilters.length > 0 ||
    manufacturerFilters.length > 0 ||
    systemFilters.length > 0 ||
    chipFilters.length > 0 ||
    localeFilters.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Search input and sort controls */}
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search character sets..."
            className="w-full px-3 py-2 pl-10 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan transition-colors"
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

          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Vertical separator */}
        {onSortFieldChange && onSortDirectionToggle && <div className="w-px bg-retro-grid/50 mx-2 self-stretch" />}

        {/* Sort controls */}
        {onSortFieldChange && onSortDirectionToggle && (
          <div className="flex gap-1 items-center">
            <span className="text-xs text-gray-400 mr-1">Sort:</span>
            {/* Sort field dropdown */}
            <SingleSelectDropdown
              options={SORT_OPTIONS}
              value={sortField}
              onChange={onSortFieldChange}
              ariaLabel="Sort by"
              className="min-w-[180px]"
            />

            {/* Sort direction toggle button */}
            <button
              type="button"
              onClick={onSortDirectionToggle}
              className={`px-3 py-2 border rounded-lg text-xs font-mono transition-colors ${
                sortDirection === "desc"
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "bg-retro-navy/50 border-retro-grid/50 text-gray-400 hover:text-gray-200 hover:border-retro-cyan/50"
              }`}
              aria-label={sortDirection === "asc" ? "Sort ascending (A to Z)" : "Sort descending (Z to A)"}
              title={sortDirection === "asc" ? "Ascending (A→Z)" : "Descending (Z→A)"}
            >
              {sortDirection === "asc" ? "abc" : "cba"}
            </button>
          </div>
        )}
      </div>

      {/* Filter dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
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

        {/* Character count filter */}
        {onCharacterCountFilterChange && (
          <MultiSelectDropdown
            label="Count"
            options={availableCharacterCounts.map((c) => ({ value: c, label: `${c} chars` }))}
            selected={characterCountFilters}
            onChange={onCharacterCountFilterChange}
            placeholder="Count"
            allOptionLabel="Any count"
          />
        )}

        {/* Manufacturer filter */}
        {onManufacturerFilterChange && (
          <MultiSelectDropdown
            label="Manufacturer"
            options={allManufacturers.map((m) => ({ value: m, label: m }))}
            selected={manufacturerFilters}
            onChange={onManufacturerFilterChange}
            placeholder="Manufacturer"
            allOptionLabel="Any manufacturer"
          />
        )}

        {/* System filter */}
        {onSystemFilterChange && (
          <MultiSelectDropdown
            label="System"
            options={systemsForManufacturers.map((s) => ({ value: s, label: s }))}
            selected={systemFilters}
            onChange={onSystemFilterChange}
            placeholder="System"
            allOptionLabel="Any system"
          />
        )}

        {/* Chip filter */}
        {onChipFilterChange && (
          <MultiSelectDropdown
            label="Chip"
            options={availableChips.map((c) => ({ value: c, label: c }))}
            selected={chipFilters}
            onChange={onChipFilterChange}
            placeholder="Chip"
            allOptionLabel="Any chip"
          />
        )}

        {/* Locale filter */}
        {onLocaleFilterChange && (
          <MultiSelectDropdown
            label="Locale"
            options={availableLocales.map((l) => ({ value: l, label: l }))}
            selected={localeFilters}
            onChange={onLocaleFilterChange}
            placeholder="Locale"
            allOptionLabel="Any locale"
          />
        )}
      </div>

      {/* Results count, pagination, and clear button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>
            {hasActiveFilters
              ? `Showing ${filteredCount} of ${totalCount} character sets`
              : `${totalCount} character set${totalCount !== 1 ? "s" : ""}`}
          </span>

          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="text-retro-cyan hover:text-retro-pink transition-colors">
              Clear filters
            </button>
          )}
        </div>

        {/* Pagination controls - show when there are enough items to paginate */}
        {pagination && onPageSizeChange && onPageChange && pagination.totalItems >= 20 && (
          <div className="flex items-center gap-3">
            {/* Page size selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Show:</span>
              <SingleSelectDropdown
                options={PAGE_SIZE_OPTIONS.map((size) => ({
                  value: size,
                  label: size === "all" ? "All" : String(size),
                }))}
                value={pagination.pageSize}
                onChange={(value) => onPageSizeChange(value as PageSize)}
                ariaLabel="Items per page"
                className="min-w-[70px]"
              />
            </div>

            {/* Page navigation - only show when there are multiple pages */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(1)}
                  disabled={!pagination.hasPreviousPage}
                  className="p-1 text-gray-400 hover:text-retro-cyan disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                  aria-label="First page"
                  title="First page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="p-1 text-gray-400 hover:text-retro-cyan disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                  title="Previous page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="px-2 text-gray-300">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>

                <button
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-1 text-gray-400 hover:text-retro-cyan disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                  title="Next page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => onPageChange(pagination.totalPages)}
                  disabled={!pagination.hasNextPage}
                  className="p-1 text-gray-400 hover:text-retro-cyan disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                  aria-label="Last page"
                  title="Last page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
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
          className="w-full px-3 py-1.5 pl-8 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
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

      <span className="text-xs text-gray-500 whitespace-nowrap">{totalCount} items</span>
    </div>
  );
}
