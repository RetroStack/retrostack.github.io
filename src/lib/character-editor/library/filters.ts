/**
 * Character ROM Editor - Library Filter Logic
 *
 * Pure functions for filtering and sorting character sets.
 * These functions have no dependencies on React or browser APIs,
 * making them easy to unit test.
 */

import type { SerializedCharacterSet } from "../types";
import { getCharacterCount } from "../types";

/**
 * Sort field options for character sets
 */
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

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * isPinned filter option values
 */
export type IsPinnedFilterValue = "pinned" | "not-pinned";

/**
 * Origin filter option values
 * Combines built-in status with user set origins
 */
export type OriginFilterValue =
  | "built-in"
  | "created"
  | "binary"
  | "text"
  | "font"
  | "image"
  | "shared"
  | "copied";

/**
 * Library filter state
 */
export interface LibraryFilterState {
  searchQuery: string;
  widthFilters: number[];
  heightFilters: number[];
  characterCountFilters: number[];
  manufacturerFilters: string[];
  systemFilters: string[];
  chipFilters: string[];
  localeFilters: string[];
  tagFilters: string[];
  sourceFilters: string[];
  isPinnedFilters: IsPinnedFilterValue[];
  originFilters: OriginFilterValue[];
}

/**
 * Create an empty filter state
 */
export function createEmptyFilterState(): LibraryFilterState {
  return {
    searchQuery: "",
    widthFilters: [],
    heightFilters: [],
    characterCountFilters: [],
    manufacturerFilters: [],
    systemFilters: [],
    chipFilters: [],
    localeFilters: [],
    tagFilters: [],
    sourceFilters: [],
    isPinnedFilters: [],
    originFilters: [],
  };
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: LibraryFilterState): boolean {
  return (
    filters.searchQuery.length > 0 ||
    filters.widthFilters.length > 0 ||
    filters.heightFilters.length > 0 ||
    filters.characterCountFilters.length > 0 ||
    filters.manufacturerFilters.length > 0 ||
    filters.systemFilters.length > 0 ||
    filters.chipFilters.length > 0 ||
    filters.localeFilters.length > 0 ||
    filters.tagFilters.length > 0 ||
    filters.sourceFilters.length > 0 ||
    filters.isPinnedFilters.length > 0 ||
    filters.originFilters.length > 0
  );
}

/**
 * Check if any dropdown filters are active (excludes search query)
 * Used to determine if the filter toggle button should show active state
 */
export function hasActiveDropdownFilters(filters: LibraryFilterState): boolean {
  return (
    filters.widthFilters.length > 0 ||
    filters.heightFilters.length > 0 ||
    filters.characterCountFilters.length > 0 ||
    filters.manufacturerFilters.length > 0 ||
    filters.systemFilters.length > 0 ||
    filters.chipFilters.length > 0 ||
    filters.localeFilters.length > 0 ||
    filters.tagFilters.length > 0 ||
    filters.sourceFilters.length > 0 ||
    filters.isPinnedFilters.length > 0 ||
    filters.originFilters.length > 0
  );
}

/**
 * Count the number of active dropdown filter categories
 */
export function countActiveDropdownFilters(filters: LibraryFilterState): number {
  let count = 0;
  if (filters.widthFilters.length > 0) count++;
  if (filters.heightFilters.length > 0) count++;
  if (filters.characterCountFilters.length > 0) count++;
  if (filters.manufacturerFilters.length > 0) count++;
  if (filters.systemFilters.length > 0) count++;
  if (filters.chipFilters.length > 0) count++;
  if (filters.localeFilters.length > 0) count++;
  if (filters.tagFilters.length > 0) count++;
  if (filters.sourceFilters.length > 0) count++;
  if (filters.isPinnedFilters.length > 0) count++;
  if (filters.originFilters.length > 0) count++;
  return count;
}

/**
 * Check if a character set matches the search query
 * Searches across name, description, source, manufacturer, system, chip, locale, tags, notes, and isBuiltIn status
 */
export function matchesSearchQuery(set: SerializedCharacterSet, query: string): boolean {
  if (!query.trim()) return true;

  const lowerQuery = query.toLowerCase();
  const tagsMatch = (set.metadata.tags ?? []).some((tag) => tag.toLowerCase().includes(lowerQuery));

  // Check notes content
  const notesMatch = (set.metadata.notes ?? []).some((note) =>
    note.text.toLowerCase().includes(lowerQuery)
  );

  // Check isBuiltIn status - match common search terms
  const builtInTerms = ["built-in", "builtin", "built in"];
  const userTerms = ["user", "custom", "user-created"];
  const isBuiltInMatch = set.metadata.isBuiltIn
    ? builtInTerms.some((term) => term.includes(lowerQuery) || lowerQuery.includes(term))
    : userTerms.some((term) => term.includes(lowerQuery) || lowerQuery.includes(term));

  return (
    set.metadata.name.toLowerCase().includes(lowerQuery) ||
    set.metadata.description.toLowerCase().includes(lowerQuery) ||
    set.metadata.source.toLowerCase().includes(lowerQuery) ||
    (set.metadata.manufacturer?.toLowerCase().includes(lowerQuery) ?? false) ||
    (set.metadata.system?.toLowerCase().includes(lowerQuery) ?? false) ||
    (set.metadata.chip?.toLowerCase().includes(lowerQuery) ?? false) ||
    (set.metadata.locale?.toLowerCase().includes(lowerQuery) ?? false) ||
    tagsMatch ||
    notesMatch ||
    isBuiltInMatch
  );
}

/**
 * Check if a character set matches the size filters
 */
export function matchesSizeFilters(
  set: SerializedCharacterSet,
  widthFilters: number[],
  heightFilters: number[],
): boolean {
  if (widthFilters.length > 0 && !widthFilters.includes(set.config.width)) {
    return false;
  }
  if (heightFilters.length > 0 && !heightFilters.includes(set.config.height)) {
    return false;
  }
  return true;
}

/**
 * Check if a character set matches the manufacturer filter
 */
export function matchesManufacturerFilter(set: SerializedCharacterSet, manufacturerFilters: string[]): boolean {
  if (manufacturerFilters.length === 0) return true;
  return !!set.metadata.manufacturer && manufacturerFilters.includes(set.metadata.manufacturer);
}

/**
 * Check if a character set matches the system filter
 */
export function matchesSystemFilter(set: SerializedCharacterSet, systemFilters: string[]): boolean {
  if (systemFilters.length === 0) return true;
  return !!set.metadata.system && systemFilters.includes(set.metadata.system);
}

/**
 * Check if a character set matches the chip filter
 */
export function matchesChipFilter(set: SerializedCharacterSet, chipFilters: string[]): boolean {
  if (chipFilters.length === 0) return true;
  return !!set.metadata.chip && chipFilters.includes(set.metadata.chip);
}

/**
 * Check if a character set matches the locale filter
 */
export function matchesLocaleFilter(set: SerializedCharacterSet, localeFilters: string[]): boolean {
  if (localeFilters.length === 0) return true;
  return !!set.metadata.locale && localeFilters.includes(set.metadata.locale);
}

/**
 * Check if a character set matches the character count filter
 */
export function matchesCharacterCountFilter(set: SerializedCharacterSet, characterCountFilters: number[]): boolean {
  if (characterCountFilters.length === 0) return true;
  return characterCountFilters.includes(getCharacterCount(set));
}

/**
 * Check if a character set matches the tag filter
 * Uses OR logic - matches if ANY selected tag is present
 */
export function matchesTagFilter(set: SerializedCharacterSet, tagFilters: string[]): boolean {
  if (tagFilters.length === 0) return true;
  const setTags = set.metadata.tags ?? [];
  return tagFilters.some((tag) => setTags.includes(tag));
}

/**
 * Check if a character set matches the source filter
 */
export function matchesSourceFilter(set: SerializedCharacterSet, sourceFilters: string[]): boolean {
  if (sourceFilters.length === 0) return true;
  return !!set.metadata.source && sourceFilters.includes(set.metadata.source);
}

/**
 * Check if a character set matches the isPinned filters
 * Uses OR logic - matches if ANY selected filter matches
 */
export function matchesIsPinnedFilter(
  set: SerializedCharacterSet,
  isPinnedFilters: IsPinnedFilterValue[],
): boolean {
  if (isPinnedFilters.length === 0) return true;
  const isPinned = set.metadata.isPinned ?? false;
  return isPinnedFilters.some((filter) => {
    if (filter === "pinned") return isPinned === true;
    if (filter === "not-pinned") return isPinned === false;
    return false;
  });
}

/**
 * Check if a character set matches the origin filters
 * Uses OR logic - matches if ANY selected filter matches
 * "built-in" matches sets with isBuiltIn === true
 * "created", "imported", "copied" match user sets based on their origin field
 */
export function matchesOriginFilter(
  set: SerializedCharacterSet,
  originFilters: OriginFilterValue[],
): boolean {
  if (originFilters.length === 0) return true;

  // Built-in sets match "built-in" filter
  if (set.metadata.isBuiltIn) {
    return originFilters.includes("built-in");
  }

  // User sets match based on their origin field
  // Default to "created" for legacy data without origin field
  const origin = set.metadata.origin ?? "created";
  return originFilters.includes(origin);
}

/**
 * Check if a character set matches all filters
 */
export function matchesAllFilters(set: SerializedCharacterSet, filters: LibraryFilterState): boolean {
  return (
    matchesSearchQuery(set, filters.searchQuery) &&
    matchesSizeFilters(set, filters.widthFilters, filters.heightFilters) &&
    matchesManufacturerFilter(set, filters.manufacturerFilters) &&
    matchesSystemFilter(set, filters.systemFilters) &&
    matchesChipFilter(set, filters.chipFilters) &&
    matchesLocaleFilter(set, filters.localeFilters) &&
    matchesCharacterCountFilter(set, filters.characterCountFilters) &&
    matchesTagFilter(set, filters.tagFilters) &&
    matchesSourceFilter(set, filters.sourceFilters) &&
    matchesIsPinnedFilter(set, filters.isPinnedFilters) &&
    matchesOriginFilter(set, filters.originFilters)
  );
}

/**
 * Filter character sets based on filter state
 */
export function filterCharacterSets(
  sets: SerializedCharacterSet[],
  filters: LibraryFilterState,
): SerializedCharacterSet[] {
  return sets.filter((set) => matchesAllFilters(set, filters));
}

/**
 * Compare two character sets by the specified field
 */
export function compareByField(a: SerializedCharacterSet, b: SerializedCharacterSet, field: SortField): number {
  switch (field) {
    case "name":
      return a.metadata.name.localeCompare(b.metadata.name);
    case "description":
      return (a.metadata.description || "").localeCompare(b.metadata.description || "");
    case "source":
      return (a.metadata.source || "").localeCompare(b.metadata.source || "");
    case "updatedAt":
      return a.metadata.updatedAt - b.metadata.updatedAt;
    case "createdAt":
      return a.metadata.createdAt - b.metadata.createdAt;
    case "width":
      return a.config.width - b.config.width;
    case "height":
      return a.config.height - b.config.height;
    case "size": {
      const aSize = a.config.width * a.config.height;
      const bSize = b.config.width * b.config.height;
      return aSize - bSize;
    }
    case "characters":
      return getCharacterCount(a) - getCharacterCount(b);
    case "manufacturer":
      return (a.metadata.manufacturer || "").localeCompare(b.metadata.manufacturer || "");
    case "system":
      return (a.metadata.system || "").localeCompare(b.metadata.system || "");
    case "chip":
      return (a.metadata.chip || "").localeCompare(b.metadata.chip || "");
    case "locale":
      return (a.metadata.locale || "").localeCompare(b.metadata.locale || "");
    default:
      return 0;
  }
}

/**
 * Sort character sets by field and direction
 * Pinned items always come first, then sorted by the specified field
 */
export function sortCharacterSets(
  sets: SerializedCharacterSet[],
  field: SortField,
  direction: SortDirection,
): SerializedCharacterSet[] {
  return [...sets].sort((a, b) => {
    // Pinned items always come first
    const aPinned = a.metadata.isPinned ? 1 : 0;
    const bPinned = b.metadata.isPinned ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;

    // Apply selected sort
    const comparison = compareByField(a, b, field);
    return direction === "asc" ? comparison : -comparison;
  });
}

/**
 * Filter and sort character sets in one operation
 */
export function filterAndSortCharacterSets(
  sets: SerializedCharacterSet[],
  filters: LibraryFilterState,
  sortField: SortField,
  sortDirection: SortDirection,
): SerializedCharacterSet[] {
  const filtered = filterCharacterSets(sets, filters);
  return sortCharacterSets(filtered, sortField, sortDirection);
}

// ============================================================================
// Available values extraction
// ============================================================================

/**
 * Get unique manufacturers from character sets
 */
export function getAvailableManufacturers(sets: SerializedCharacterSet[]): string[] {
  const manufacturers = new Set<string>();
  for (const set of sets) {
    if (set.metadata.manufacturer) {
      manufacturers.add(set.metadata.manufacturer);
    }
  }
  return Array.from(manufacturers).sort();
}

/**
 * Get unique systems from character sets
 * If manufacturerFilters is provided, only returns systems for those manufacturers
 */
export function getAvailableSystems(sets: SerializedCharacterSet[], manufacturerFilters?: string[]): string[] {
  const systems = new Set<string>();
  const setsToCheck =
    manufacturerFilters && manufacturerFilters.length > 0
      ? sets.filter((set) => set.metadata.manufacturer && manufacturerFilters.includes(set.metadata.manufacturer))
      : sets;

  for (const set of setsToCheck) {
    if (set.metadata.system) {
      systems.add(set.metadata.system);
    }
  }
  return Array.from(systems).sort();
}

/**
 * Get unique chips from character sets
 */
export function getAvailableChips(sets: SerializedCharacterSet[]): string[] {
  const chips = new Set<string>();
  for (const set of sets) {
    if (set.metadata.chip) {
      chips.add(set.metadata.chip);
    }
  }
  return Array.from(chips).sort();
}

/**
 * Get unique locales from character sets
 */
export function getAvailableLocales(sets: SerializedCharacterSet[]): string[] {
  const locales = new Set<string>();
  for (const set of sets) {
    if (set.metadata.locale) {
      locales.add(set.metadata.locale);
    }
  }
  return Array.from(locales).sort();
}

/**
 * Get unique character counts from character sets
 */
export function getAvailableCharacterCounts(sets: SerializedCharacterSet[]): number[] {
  const counts = new Set<number>();
  for (const set of sets) {
    counts.add(getCharacterCount(set));
  }
  return Array.from(counts).sort((a, b) => a - b);
}

/**
 * Get unique tags from character sets
 */
export function getAvailableTags(sets: SerializedCharacterSet[]): string[] {
  const tags = new Set<string>();
  for (const set of sets) {
    for (const tag of set.metadata.tags ?? []) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

/**
 * Get unique sources from character sets
 */
export function getAvailableSources(sets: SerializedCharacterSet[]): string[] {
  const sources = new Set<string>();
  for (const set of sets) {
    if (set.metadata.source) {
      sources.add(set.metadata.source);
    }
  }
  return Array.from(sources).sort();
}

/**
 * Get unique origins from character sets
 * Built-in sets return "built-in", user sets return their origin field
 */
export function getAvailableOrigins(sets: SerializedCharacterSet[]): OriginFilterValue[] {
  const origins = new Set<OriginFilterValue>();
  for (const set of sets) {
    if (set.metadata.isBuiltIn) {
      origins.add("built-in");
    } else {
      // Default to "created" for legacy data without origin field
      origins.add(set.metadata.origin ?? "created");
    }
  }
  return Array.from(origins).sort();
}

/**
 * Get valid systems for the current manufacturer selection
 * Used to clear invalid system filters when manufacturers change
 */
export function getValidSystemsForManufacturers(
  sets: SerializedCharacterSet[],
  manufacturerFilters: string[],
): Set<string> {
  if (manufacturerFilters.length === 0) {
    return new Set(getAvailableSystems(sets));
  }

  const validSystems = new Set<string>();
  for (const set of sets) {
    if (set.metadata.manufacturer && manufacturerFilters.includes(set.metadata.manufacturer) && set.metadata.system) {
      validSystems.add(set.metadata.system);
    }
  }
  return validSystems;
}

/**
 * Filter out invalid system selections when manufacturers change
 */
export function filterInvalidSystems(
  currentSystemFilters: string[],
  sets: SerializedCharacterSet[],
  manufacturerFilters: string[],
): string[] {
  if (manufacturerFilters.length === 0) {
    return currentSystemFilters;
  }

  const validSystems = getValidSystemsForManufacturers(sets, manufacturerFilters);
  return currentSystemFilters.filter((s) => validSystems.has(s));
}

// ============================================================================
// Pagination
// ============================================================================

/**
 * Available page size options
 * "all" means show all items without pagination
 */
export const PAGE_SIZE_OPTIONS = [20, 50, 100, "all"] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

/**
 * Default page size
 */
export const DEFAULT_PAGE_SIZE: PageSize = 20;

/**
 * Pagination state
 */
export interface PaginationState {
  currentPage: number;
  pageSize: PageSize;
}

/**
 * Pagination result with metadata
 */
export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: PageSize;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Apply pagination to an array of items
 */
export function paginateItems<T>(items: T[], currentPage: number, pageSize: PageSize): PaginatedResult<T> {
  const totalItems = items.length;

  // "all" means show all items without pagination
  if (pageSize === "all") {
    return {
      items,
      totalItems,
      totalPages: 1,
      currentPage: 1,
      pageSize,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  // Ensure current page is within valid range
  const validatedPage = Math.max(1, Math.min(currentPage, totalPages));
  const startIndex = (validatedPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    items: items.slice(startIndex, endIndex),
    totalItems,
    totalPages,
    currentPage: validatedPage,
    pageSize,
    hasNextPage: validatedPage < totalPages,
    hasPreviousPage: validatedPage > 1,
  };
}

/**
 * Validate and parse page size from storage
 */
export function parsePageSize(value: string | null): PageSize {
  if (!value) return DEFAULT_PAGE_SIZE;
  if (value === "all") return "all";
  const parsed = parseInt(value, 10);
  if (PAGE_SIZE_OPTIONS.includes(parsed as PageSize)) {
    return parsed as PageSize;
  }
  return DEFAULT_PAGE_SIZE;
}
