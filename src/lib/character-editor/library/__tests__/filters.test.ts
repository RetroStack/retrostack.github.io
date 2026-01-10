/**
 * Character ROM Editor - Filter Logic Tests
 *
 * Comprehensive unit tests for the library filter and sort functions.
 * Tests cover all filter combinations, edge cases, and sorting behaviors.
 */

import {
  filterCharacterSets,
  matchesSearchQuery,
  matchesSizeFilters,
  matchesManufacturerFilter,
  matchesSystemFilter,
  matchesChipFilter,
  matchesLocaleFilter,
  matchesCharacterCountFilter,
  matchesAllFilters,
  sortCharacterSets,
  compareByField,
  filterAndSortCharacterSets,
  getAvailableManufacturers,
  getAvailableSystems,
  getAvailableChips,
  getAvailableLocales,
  getAvailableCharacterCounts,
  getValidSystemsForManufacturers,
  filterInvalidSystems,
  hasActiveFilters,
  createEmptyFilterState,
  paginateItems,
  parsePageSize,
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  type LibraryFilterState,
  type SortField,
  type SortDirection,
  type PageSize,
} from "@/lib/character-editor/library/filters";

import {
  sampleCharacterSets,
  commodore64CharacterSet,
  appleIICharacterSet,
  atari800CharacterSet,
  userCharacterSet,
  germanCharacterSet,
  emptyFilter,
  commodoreFilter,
  size8x8Filter,
  searchQueryFilter,
  complexFilter,
} from "@/lib/character-editor/__tests__/fixtures";

import { createMockSerializedCharacterSet } from "@/lib/character-editor/__tests__/testUtils";

// ============================================================================
// createEmptyFilterState
// ============================================================================

describe("createEmptyFilterState", () => {
  it("returns a filter state with all empty values", () => {
    const filter = createEmptyFilterState();

    expect(filter.searchQuery).toBe("");
    expect(filter.widthFilters).toEqual([]);
    expect(filter.heightFilters).toEqual([]);
    expect(filter.characterCountFilters).toEqual([]);
    expect(filter.manufacturerFilters).toEqual([]);
    expect(filter.systemFilters).toEqual([]);
    expect(filter.chipFilters).toEqual([]);
    expect(filter.localeFilters).toEqual([]);
  });

  it("returns a new object each time", () => {
    const filter1 = createEmptyFilterState();
    const filter2 = createEmptyFilterState();

    expect(filter1).not.toBe(filter2);
    expect(filter1.widthFilters).not.toBe(filter2.widthFilters);
  });
});

// ============================================================================
// hasActiveFilters
// ============================================================================

describe("hasActiveFilters", () => {
  it("returns false for empty filter state", () => {
    expect(hasActiveFilters(emptyFilter)).toBe(false);
  });

  it("returns true when searchQuery is set", () => {
    expect(hasActiveFilters(searchQueryFilter)).toBe(true);
  });

  it("returns true when widthFilters has values", () => {
    const filter: LibraryFilterState = {
      ...emptyFilter,
      widthFilters: [8],
    };
    expect(hasActiveFilters(filter)).toBe(true);
  });

  it("returns true when heightFilters has values", () => {
    const filter: LibraryFilterState = {
      ...emptyFilter,
      heightFilters: [16],
    };
    expect(hasActiveFilters(filter)).toBe(true);
  });

  it("returns true when characterCountFilters has values", () => {
    const filter: LibraryFilterState = {
      ...emptyFilter,
      characterCountFilters: [256],
    };
    expect(hasActiveFilters(filter)).toBe(true);
  });

  it("returns true when manufacturerFilters has values", () => {
    expect(hasActiveFilters(commodoreFilter)).toBe(true);
  });

  it("returns true when systemFilters has values", () => {
    const filter: LibraryFilterState = {
      ...emptyFilter,
      systemFilters: ["C64"],
    };
    expect(hasActiveFilters(filter)).toBe(true);
  });

  it("returns true when chipFilters has values", () => {
    const filter: LibraryFilterState = {
      ...emptyFilter,
      chipFilters: ["901225-01"],
    };
    expect(hasActiveFilters(filter)).toBe(true);
  });

  it("returns true when localeFilters has values", () => {
    const filter: LibraryFilterState = {
      ...emptyFilter,
      localeFilters: ["English"],
    };
    expect(hasActiveFilters(filter)).toBe(true);
  });

  it("returns true when multiple filters are active", () => {
    expect(hasActiveFilters(complexFilter)).toBe(true);
  });
});

// ============================================================================
// matchesSearchQuery
// ============================================================================

describe("matchesSearchQuery", () => {
  it("matches when query is empty", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "")).toBe(true);
  });

  it("matches when query is whitespace only", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "   ")).toBe(true);
  });

  it("matches name (case insensitive)", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "commodore")).toBe(true);
    expect(matchesSearchQuery(commodore64CharacterSet, "COMMODORE")).toBe(true);
    expect(matchesSearchQuery(commodore64CharacterSet, "Commodore 64")).toBe(true);
  });

  it("matches description", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "Standard")).toBe(true);
    expect(matchesSearchQuery(commodore64CharacterSet, "character set")).toBe(true);
  });

  it("matches source", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "VICE")).toBe(true);
    expect(matchesSearchQuery(commodore64CharacterSet, "vice")).toBe(true);
  });

  it("matches manufacturer", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "Commodore")).toBe(true);
  });

  it("matches system", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "C64")).toBe(true);
    expect(matchesSearchQuery(commodore64CharacterSet, "c64")).toBe(true);
  });

  it("matches chip", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "901225")).toBe(true);
    expect(matchesSearchQuery(commodore64CharacterSet, "901225-01")).toBe(true);
  });

  it("matches locale", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "English")).toBe(true);
    expect(matchesSearchQuery(germanCharacterSet, "German")).toBe(true);
  });

  it("returns false when no fields match", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "Nintendo")).toBe(false);
    expect(matchesSearchQuery(commodore64CharacterSet, "xyz123")).toBe(false);
  });

  it("handles character sets with empty metadata fields", () => {
    expect(matchesSearchQuery(userCharacterSet, "Custom")).toBe(true);
    expect(matchesSearchQuery(userCharacterSet, "Commodore")).toBe(false);
  });

  it("handles partial matches", () => {
    expect(matchesSearchQuery(appleIICharacterSet, "Apple")).toBe(true);
    expect(matchesSearchQuery(appleIICharacterSet, "II")).toBe(true);
    expect(matchesSearchQuery(appleIICharacterSet, "Win")).toBe(true); // AppleWin
  });
});

// ============================================================================
// matchesSizeFilters
// ============================================================================

describe("matchesSizeFilters", () => {
  it("matches when no filters are set", () => {
    expect(matchesSizeFilters(commodore64CharacterSet, [], [])).toBe(true);
  });

  it("matches width filter only", () => {
    expect(matchesSizeFilters(commodore64CharacterSet, [8], [])).toBe(true);
    expect(matchesSizeFilters(commodore64CharacterSet, [16], [])).toBe(false);
  });

  it("matches height filter only", () => {
    expect(matchesSizeFilters(commodore64CharacterSet, [], [8])).toBe(true);
    expect(matchesSizeFilters(commodore64CharacterSet, [], [16])).toBe(false);
  });

  it("matches both width and height filters", () => {
    expect(matchesSizeFilters(commodore64CharacterSet, [8], [8])).toBe(true);
    expect(matchesSizeFilters(commodore64CharacterSet, [8], [16])).toBe(false);
    expect(matchesSizeFilters(commodore64CharacterSet, [16], [8])).toBe(false);
  });

  it("matches with multiple width options (OR logic)", () => {
    expect(matchesSizeFilters(commodore64CharacterSet, [7, 8, 16], [])).toBe(true);
    expect(matchesSizeFilters(appleIICharacterSet, [7, 8], [])).toBe(true);
    expect(matchesSizeFilters(commodore64CharacterSet, [7, 16], [])).toBe(false);
  });

  it("matches with multiple height options (OR logic)", () => {
    expect(matchesSizeFilters(commodore64CharacterSet, [], [8, 16])).toBe(true);
    expect(matchesSizeFilters(commodore64CharacterSet, [], [10, 12, 16])).toBe(false);
  });

  it("handles character sets with different dimensions", () => {
    // Apple II has width 7
    expect(matchesSizeFilters(appleIICharacterSet, [7], [8])).toBe(true);
    expect(matchesSizeFilters(appleIICharacterSet, [8], [8])).toBe(false);
  });
});

// ============================================================================
// matchesManufacturerFilter
// ============================================================================

describe("matchesManufacturerFilter", () => {
  it("matches when no filters are set", () => {
    expect(matchesManufacturerFilter(commodore64CharacterSet, [])).toBe(true);
    expect(matchesManufacturerFilter(userCharacterSet, [])).toBe(true);
  });

  it("matches single manufacturer filter", () => {
    expect(matchesManufacturerFilter(commodore64CharacterSet, ["Commodore"])).toBe(true);
    expect(matchesManufacturerFilter(commodore64CharacterSet, ["Apple"])).toBe(false);
  });

  it("matches multiple manufacturer filters (OR logic)", () => {
    expect(matchesManufacturerFilter(commodore64CharacterSet, ["Commodore", "Apple"])).toBe(true);
    expect(matchesManufacturerFilter(appleIICharacterSet, ["Commodore", "Apple"])).toBe(true);
    expect(matchesManufacturerFilter(atari800CharacterSet, ["Commodore", "Apple"])).toBe(false);
  });

  it("returns false for character sets without manufacturer", () => {
    expect(matchesManufacturerFilter(userCharacterSet, ["Commodore"])).toBe(false);
  });

  it("is case sensitive", () => {
    expect(matchesManufacturerFilter(commodore64CharacterSet, ["commodore"])).toBe(false);
    expect(matchesManufacturerFilter(commodore64CharacterSet, ["COMMODORE"])).toBe(false);
  });
});

// ============================================================================
// matchesSystemFilter
// ============================================================================

describe("matchesSystemFilter", () => {
  it("matches when no filters are set", () => {
    expect(matchesSystemFilter(commodore64CharacterSet, [])).toBe(true);
    expect(matchesSystemFilter(userCharacterSet, [])).toBe(true);
  });

  it("matches single system filter", () => {
    expect(matchesSystemFilter(commodore64CharacterSet, ["C64"])).toBe(true);
    expect(matchesSystemFilter(commodore64CharacterSet, ["Apple II"])).toBe(false);
  });

  it("matches multiple system filters (OR logic)", () => {
    expect(matchesSystemFilter(commodore64CharacterSet, ["C64", "Apple II"])).toBe(true);
    expect(matchesSystemFilter(appleIICharacterSet, ["C64", "Apple II"])).toBe(true);
    expect(matchesSystemFilter(atari800CharacterSet, ["C64", "Apple II"])).toBe(false);
  });

  it("returns false for character sets without system", () => {
    expect(matchesSystemFilter(userCharacterSet, ["C64"])).toBe(false);
  });

  it("is case sensitive", () => {
    expect(matchesSystemFilter(commodore64CharacterSet, ["c64"])).toBe(false);
  });
});

// ============================================================================
// matchesChipFilter
// ============================================================================

describe("matchesChipFilter", () => {
  it("matches when no filters are set", () => {
    expect(matchesChipFilter(commodore64CharacterSet, [])).toBe(true);
  });

  it("matches single chip filter", () => {
    expect(matchesChipFilter(commodore64CharacterSet, ["901225-01"])).toBe(true);
    expect(matchesChipFilter(commodore64CharacterSet, ["2513"])).toBe(false);
  });

  it("matches multiple chip filters (OR logic)", () => {
    expect(matchesChipFilter(commodore64CharacterSet, ["901225-01", "2513"])).toBe(true);
    expect(matchesChipFilter(appleIICharacterSet, ["901225-01", "2513"])).toBe(true);
  });

  it("returns false for character sets without chip", () => {
    expect(matchesChipFilter(userCharacterSet, ["901225-01"])).toBe(false);
  });
});

// ============================================================================
// matchesLocaleFilter
// ============================================================================

describe("matchesLocaleFilter", () => {
  it("matches when no filters are set", () => {
    expect(matchesLocaleFilter(commodore64CharacterSet, [])).toBe(true);
  });

  it("matches single locale filter", () => {
    expect(matchesLocaleFilter(commodore64CharacterSet, ["English"])).toBe(true);
    expect(matchesLocaleFilter(germanCharacterSet, ["German"])).toBe(true);
    expect(matchesLocaleFilter(commodore64CharacterSet, ["German"])).toBe(false);
  });

  it("matches multiple locale filters (OR logic)", () => {
    expect(matchesLocaleFilter(commodore64CharacterSet, ["English", "German"])).toBe(true);
    expect(matchesLocaleFilter(germanCharacterSet, ["English", "German"])).toBe(true);
  });

  it("returns false for character sets without locale", () => {
    expect(matchesLocaleFilter(userCharacterSet, ["English"])).toBe(false);
  });
});

// ============================================================================
// matchesCharacterCountFilter
// ============================================================================

describe("matchesCharacterCountFilter", () => {
  it("matches when no filters are set", () => {
    expect(matchesCharacterCountFilter(commodore64CharacterSet, [])).toBe(true);
  });

  it("matches single character count filter", () => {
    expect(matchesCharacterCountFilter(commodore64CharacterSet, [256])).toBe(true);
    expect(matchesCharacterCountFilter(appleIICharacterSet, [128])).toBe(true);
    expect(matchesCharacterCountFilter(commodore64CharacterSet, [128])).toBe(false);
  });

  it("matches multiple character count filters (OR logic)", () => {
    expect(matchesCharacterCountFilter(commodore64CharacterSet, [128, 256])).toBe(true);
    expect(matchesCharacterCountFilter(appleIICharacterSet, [128, 256])).toBe(true);
    expect(matchesCharacterCountFilter(userCharacterSet, [128, 256])).toBe(false);
  });
});

// ============================================================================
// matchesAllFilters
// ============================================================================

describe("matchesAllFilters", () => {
  it("matches all with empty filter", () => {
    expect(matchesAllFilters(commodore64CharacterSet, emptyFilter)).toBe(true);
    expect(matchesAllFilters(userCharacterSet, emptyFilter)).toBe(true);
  });

  it("matches with single filter criterion", () => {
    expect(matchesAllFilters(commodore64CharacterSet, commodoreFilter)).toBe(true);
    expect(matchesAllFilters(appleIICharacterSet, commodoreFilter)).toBe(false);
  });

  it("matches with size filter", () => {
    expect(matchesAllFilters(commodore64CharacterSet, size8x8Filter)).toBe(true);
    // Apple II has 7x8 dimensions
    expect(matchesAllFilters(appleIICharacterSet, size8x8Filter)).toBe(false);
  });

  it("matches with search query filter", () => {
    expect(matchesAllFilters(commodore64CharacterSet, searchQueryFilter)).toBe(true);
    expect(matchesAllFilters(germanCharacterSet, searchQueryFilter)).toBe(true); // Contains "C64" in name
    expect(matchesAllFilters(appleIICharacterSet, searchQueryFilter)).toBe(false);
  });

  it("matches with complex filter (all criteria must pass)", () => {
    // complexFilter: width 8, height 8, characterCount 256, manufacturer Commodore, system C64, locale English
    expect(matchesAllFilters(commodore64CharacterSet, complexFilter)).toBe(true);
    expect(matchesAllFilters(germanCharacterSet, complexFilter)).toBe(false); // German locale
    expect(matchesAllFilters(appleIICharacterSet, complexFilter)).toBe(false);
  });

  it("requires all criteria to pass (AND logic)", () => {
    const strictFilter: LibraryFilterState = {
      ...emptyFilter,
      manufacturerFilters: ["Commodore"],
      systemFilters: ["C64"],
      localeFilters: ["German"],
    };
    expect(matchesAllFilters(germanCharacterSet, strictFilter)).toBe(true);
    expect(matchesAllFilters(commodore64CharacterSet, strictFilter)).toBe(false);
  });
});

// ============================================================================
// filterCharacterSets
// ============================================================================

describe("filterCharacterSets", () => {
  it("returns all sets with empty filter", () => {
    const result = filterCharacterSets(sampleCharacterSets, emptyFilter);
    expect(result).toHaveLength(sampleCharacterSets.length);
  });

  it("filters by manufacturer", () => {
    const result = filterCharacterSets(sampleCharacterSets, commodoreFilter);
    expect(result).toHaveLength(2); // commodore64CharacterSet and germanCharacterSet
    expect(result.every((s) => s.metadata.manufacturer === "Commodore")).toBe(true);
  });

  it("filters by size", () => {
    const result = filterCharacterSets(sampleCharacterSets, size8x8Filter);
    // All except Apple II (7x8) should match
    expect(result).toHaveLength(4);
    expect(result.find((s) => s.metadata.name === "Apple II Standard")).toBeUndefined();
  });

  it("filters by search query", () => {
    const result = filterCharacterSets(sampleCharacterSets, searchQueryFilter);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) =>
      s.metadata.name.toLowerCase().includes("c64") ||
      s.metadata.system?.toLowerCase().includes("c64")
    )).toBe(true);
  });

  it("filters by complex criteria", () => {
    const result = filterCharacterSets(sampleCharacterSets, complexFilter);
    expect(result).toHaveLength(1);
    expect(result[0].metadata.name).toBe("Commodore 64 US");
  });

  it("returns empty array when no matches", () => {
    const noMatchFilter: LibraryFilterState = {
      ...emptyFilter,
      manufacturerFilters: ["Nintendo"],
    };
    const result = filterCharacterSets(sampleCharacterSets, noMatchFilter);
    expect(result).toHaveLength(0);
  });

  it("handles empty input array", () => {
    const result = filterCharacterSets([], commodoreFilter);
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// compareByField
// ============================================================================

describe("compareByField", () => {
  it("compares by name alphabetically", () => {
    expect(compareByField(appleIICharacterSet, commodore64CharacterSet, "name")).toBeLessThan(0);
    expect(compareByField(commodore64CharacterSet, appleIICharacterSet, "name")).toBeGreaterThan(0);
    expect(compareByField(commodore64CharacterSet, commodore64CharacterSet, "name")).toBe(0);
  });

  it("compares by description", () => {
    const result = compareByField(appleIICharacterSet, commodore64CharacterSet, "description");
    expect(typeof result).toBe("number");
  });

  it("compares by source", () => {
    // Altirra < AppleWin < VICE
    expect(compareByField(atari800CharacterSet, appleIICharacterSet, "source")).toBeLessThan(0);
    expect(compareByField(appleIICharacterSet, commodore64CharacterSet, "source")).toBeLessThan(0);
  });

  it("compares by updatedAt (numeric)", () => {
    const older = createMockSerializedCharacterSet({
      metadata: { updatedAt: 1000 },
    });
    const newer = createMockSerializedCharacterSet({
      metadata: { updatedAt: 2000 },
    });
    expect(compareByField(older, newer, "updatedAt")).toBeLessThan(0);
    expect(compareByField(newer, older, "updatedAt")).toBeGreaterThan(0);
  });

  it("compares by createdAt (numeric)", () => {
    const older = createMockSerializedCharacterSet({
      metadata: { createdAt: 1000 },
    });
    const newer = createMockSerializedCharacterSet({
      metadata: { createdAt: 2000 },
    });
    expect(compareByField(older, newer, "createdAt")).toBeLessThan(0);
  });

  it("compares by width (numeric)", () => {
    expect(compareByField(appleIICharacterSet, commodore64CharacterSet, "width")).toBeLessThan(0);
  });

  it("compares by height (numeric)", () => {
    const short = createMockSerializedCharacterSet({
      config: { height: 8 },
    });
    const tall = createMockSerializedCharacterSet({
      config: { height: 16 },
    });
    expect(compareByField(short, tall, "height")).toBeLessThan(0);
  });

  it("compares by size (width * height)", () => {
    const small = createMockSerializedCharacterSet({
      config: { width: 8, height: 8 },
    });
    const large = createMockSerializedCharacterSet({
      config: { width: 16, height: 16 },
    });
    expect(compareByField(small, large, "size")).toBeLessThan(0);
  });

  it("compares by character count", () => {
    expect(compareByField(appleIICharacterSet, commodore64CharacterSet, "characters")).toBeLessThan(0);
  });

  it("compares by manufacturer alphabetically", () => {
    expect(compareByField(appleIICharacterSet, commodore64CharacterSet, "manufacturer")).toBeLessThan(0);
  });

  it("compares by system alphabetically", () => {
    expect(compareByField(appleIICharacterSet, atari800CharacterSet, "system")).toBeLessThan(0);
  });

  it("compares by chip alphabetically", () => {
    const result = compareByField(appleIICharacterSet, commodore64CharacterSet, "chip");
    expect(typeof result).toBe("number");
  });

  it("compares by locale alphabetically", () => {
    expect(compareByField(commodore64CharacterSet, germanCharacterSet, "locale")).toBeLessThan(0);
  });

  it("handles empty optional fields gracefully", () => {
    // userCharacterSet has empty manufacturer, system, etc.
    expect(compareByField(userCharacterSet, commodore64CharacterSet, "manufacturer")).toBeLessThan(0);
    expect(compareByField(commodore64CharacterSet, userCharacterSet, "manufacturer")).toBeGreaterThan(0);
  });
});

// ============================================================================
// sortCharacterSets
// ============================================================================

describe("sortCharacterSets", () => {
  it("sorts by name ascending", () => {
    const result = sortCharacterSets(sampleCharacterSets, "name", "asc");
    const names = result.map((s) => s.metadata.name);

    // Pinned items come first (Atari 800 is pinned)
    expect(names[0]).toBe("Atari 800");

    // Rest are sorted alphabetically
    const unpinnedNames = names.slice(1);
    const sortedUnpinned = [...unpinnedNames].sort();
    expect(unpinnedNames).toEqual(sortedUnpinned);
  });

  it("sorts by name descending", () => {
    const result = sortCharacterSets(sampleCharacterSets, "name", "desc");
    const names = result.map((s) => s.metadata.name);

    // Pinned items still come first
    expect(names[0]).toBe("Atari 800");

    // Rest are sorted in reverse alphabetical order
    const unpinnedNames = names.slice(1);
    const sortedUnpinned = [...unpinnedNames].sort().reverse();
    expect(unpinnedNames).toEqual(sortedUnpinned);
  });

  it("pinned items always come first", () => {
    const result = sortCharacterSets(sampleCharacterSets, "name", "asc");

    // atari800CharacterSet is pinned
    expect(result[0].metadata.isPinned).toBe(true);
    expect(result[0].metadata.name).toBe("Atari 800");
  });

  it("maintains pinned priority regardless of sort direction", () => {
    const ascResult = sortCharacterSets(sampleCharacterSets, "name", "asc");
    const descResult = sortCharacterSets(sampleCharacterSets, "name", "desc");

    expect(ascResult[0].metadata.isPinned).toBe(true);
    expect(descResult[0].metadata.isPinned).toBe(true);
  });

  it("sorts by updatedAt ascending", () => {
    const result = sortCharacterSets(sampleCharacterSets, "updatedAt", "asc");

    // Skip pinned items for order verification
    const unpinned = result.filter((s) => !s.metadata.isPinned);
    for (let i = 1; i < unpinned.length; i++) {
      expect(unpinned[i].metadata.updatedAt).toBeGreaterThanOrEqual(
        unpinned[i - 1].metadata.updatedAt
      );
    }
  });

  it("sorts by updatedAt descending", () => {
    const result = sortCharacterSets(sampleCharacterSets, "updatedAt", "desc");

    const unpinned = result.filter((s) => !s.metadata.isPinned);
    for (let i = 1; i < unpinned.length; i++) {
      expect(unpinned[i].metadata.updatedAt).toBeLessThanOrEqual(
        unpinned[i - 1].metadata.updatedAt
      );
    }
  });

  it("does not mutate the original array", () => {
    const original = [...sampleCharacterSets];
    sortCharacterSets(sampleCharacterSets, "name", "desc");
    expect(sampleCharacterSets).toEqual(original);
  });

  it("handles empty array", () => {
    const result = sortCharacterSets([], "name", "asc");
    expect(result).toEqual([]);
  });

  it("handles single item array", () => {
    const single = [commodore64CharacterSet];
    const result = sortCharacterSets(single, "name", "asc");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(commodore64CharacterSet);
  });

  it("sorts by manufacturer", () => {
    const result = sortCharacterSets(sampleCharacterSets, "manufacturer", "asc");
    const unpinned = result.filter((s) => !s.metadata.isPinned);

    // Empty manufacturers should come first, then alphabetical
    for (let i = 1; i < unpinned.length; i++) {
      const prev = unpinned[i - 1].metadata.manufacturer || "";
      const curr = unpinned[i].metadata.manufacturer || "";
      expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
    }
  });
});

// ============================================================================
// filterAndSortCharacterSets
// ============================================================================

describe("filterAndSortCharacterSets", () => {
  it("filters and then sorts", () => {
    const result = filterAndSortCharacterSets(
      sampleCharacterSets,
      commodoreFilter,
      "name",
      "asc"
    );

    // Should only contain Commodore sets
    expect(result.every((s) => s.metadata.manufacturer === "Commodore")).toBe(true);

    // Should be sorted by name
    const names = result.map((s) => s.metadata.name);
    const sortedNames = [...names].sort();
    expect(names).toEqual(sortedNames);
  });

  it("applies empty filter and sorts all", () => {
    const result = filterAndSortCharacterSets(
      sampleCharacterSets,
      emptyFilter,
      "name",
      "desc"
    );

    expect(result).toHaveLength(sampleCharacterSets.length);
  });

  it("returns empty array when filter matches nothing", () => {
    const noMatchFilter: LibraryFilterState = {
      ...emptyFilter,
      searchQuery: "nonexistent123456",
    };
    const result = filterAndSortCharacterSets(
      sampleCharacterSets,
      noMatchFilter,
      "name",
      "asc"
    );

    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// getAvailableManufacturers
// ============================================================================

describe("getAvailableManufacturers", () => {
  it("returns unique manufacturers sorted alphabetically", () => {
    const result = getAvailableManufacturers(sampleCharacterSets);

    expect(result).toContain("Apple");
    expect(result).toContain("Atari");
    expect(result).toContain("Commodore");

    // Should be sorted
    const sorted = [...result].sort();
    expect(result).toEqual(sorted);
  });

  it("excludes empty manufacturer values", () => {
    const result = getAvailableManufacturers(sampleCharacterSets);

    expect(result).not.toContain("");
    expect(result).not.toContain(undefined);
  });

  it("returns empty array for empty input", () => {
    const result = getAvailableManufacturers([]);
    expect(result).toEqual([]);
  });

  it("returns unique values only", () => {
    // germanCharacterSet and commodore64CharacterSet both have "Commodore"
    const result = getAvailableManufacturers(sampleCharacterSets);
    const commodoreCount = result.filter((m) => m === "Commodore").length;
    expect(commodoreCount).toBe(1);
  });
});

// ============================================================================
// getAvailableSystems
// ============================================================================

describe("getAvailableSystems", () => {
  it("returns all unique systems when no manufacturer filter", () => {
    const result = getAvailableSystems(sampleCharacterSets);

    expect(result).toContain("Apple II");
    expect(result).toContain("Atari 800");
    expect(result).toContain("C64");

    // Should be sorted
    const sorted = [...result].sort();
    expect(result).toEqual(sorted);
  });

  it("filters systems by manufacturer", () => {
    const result = getAvailableSystems(sampleCharacterSets, ["Commodore"]);

    expect(result).toContain("C64");
    expect(result).not.toContain("Apple II");
    expect(result).not.toContain("Atari 800");
  });

  it("returns systems for multiple manufacturers", () => {
    const result = getAvailableSystems(sampleCharacterSets, ["Commodore", "Apple"]);

    expect(result).toContain("C64");
    expect(result).toContain("Apple II");
    expect(result).not.toContain("Atari 800");
  });

  it("excludes empty system values", () => {
    const result = getAvailableSystems(sampleCharacterSets);

    expect(result).not.toContain("");
  });

  it("returns empty array when no systems match manufacturer", () => {
    const result = getAvailableSystems(sampleCharacterSets, ["Nintendo"]);
    expect(result).toEqual([]);
  });

  it("treats empty manufacturer array as no filter", () => {
    const withEmpty = getAvailableSystems(sampleCharacterSets, []);
    const withUndefined = getAvailableSystems(sampleCharacterSets);

    expect(withEmpty).toEqual(withUndefined);
  });
});

// ============================================================================
// getAvailableChips
// ============================================================================

describe("getAvailableChips", () => {
  it("returns unique chips sorted alphabetically", () => {
    const result = getAvailableChips(sampleCharacterSets);

    expect(result).toContain("901225-01");
    expect(result).toContain("901225-02");
    expect(result).toContain("2513");
    expect(result).toContain("CO14599");

    const sorted = [...result].sort();
    expect(result).toEqual(sorted);
  });

  it("excludes empty chip values", () => {
    const result = getAvailableChips(sampleCharacterSets);
    expect(result).not.toContain("");
  });

  it("returns empty array for empty input", () => {
    const result = getAvailableChips([]);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// getAvailableLocales
// ============================================================================

describe("getAvailableLocales", () => {
  it("returns unique locales sorted alphabetically", () => {
    const result = getAvailableLocales(sampleCharacterSets);

    expect(result).toContain("English");
    expect(result).toContain("German");

    const sorted = [...result].sort();
    expect(result).toEqual(sorted);
  });

  it("excludes empty locale values", () => {
    const result = getAvailableLocales(sampleCharacterSets);
    expect(result).not.toContain("");
  });

  it("returns empty array for empty input", () => {
    const result = getAvailableLocales([]);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// getAvailableCharacterCounts
// ============================================================================

describe("getAvailableCharacterCounts", () => {
  it("returns unique character counts sorted numerically", () => {
    const result = getAvailableCharacterCounts(sampleCharacterSets);

    // Should contain counts from our sample sets
    expect(result.length).toBeGreaterThan(0);

    // Should be sorted numerically (ascending)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1]);
    }
  });

  it("returns empty array for empty input", () => {
    const result = getAvailableCharacterCounts([]);
    expect(result).toEqual([]);
  });

  it("returns unique values only", () => {
    const result = getAvailableCharacterCounts(sampleCharacterSets);
    const uniqueSet = new Set(result);
    expect(result.length).toBe(uniqueSet.size);
  });
});

// ============================================================================
// getValidSystemsForManufacturers
// ============================================================================

describe("getValidSystemsForManufacturers", () => {
  it("returns all systems when no manufacturer filter", () => {
    const result = getValidSystemsForManufacturers(sampleCharacterSets, []);

    expect(result.has("Apple II")).toBe(true);
    expect(result.has("Atari 800")).toBe(true);
    expect(result.has("C64")).toBe(true);
  });

  it("returns only systems for specified manufacturers", () => {
    const result = getValidSystemsForManufacturers(sampleCharacterSets, ["Commodore"]);

    expect(result.has("C64")).toBe(true);
    expect(result.has("Apple II")).toBe(false);
    expect(result.has("Atari 800")).toBe(false);
  });

  it("returns systems for multiple manufacturers", () => {
    const result = getValidSystemsForManufacturers(sampleCharacterSets, ["Commodore", "Atari"]);

    expect(result.has("C64")).toBe(true);
    expect(result.has("Atari 800")).toBe(true);
    expect(result.has("Apple II")).toBe(false);
  });

  it("returns empty Set for non-existent manufacturer", () => {
    const result = getValidSystemsForManufacturers(sampleCharacterSets, ["Nintendo"]);
    expect(result.size).toBe(0);
  });
});

// ============================================================================
// filterInvalidSystems
// ============================================================================

describe("filterInvalidSystems", () => {
  it("returns all systems when no manufacturer filter", () => {
    const currentSystems = ["C64", "Apple II", "Atari 800"];
    const result = filterInvalidSystems(currentSystems, sampleCharacterSets, []);

    expect(result).toEqual(currentSystems);
  });

  it("removes systems not matching manufacturers", () => {
    const currentSystems = ["C64", "Apple II", "Atari 800"];
    const result = filterInvalidSystems(currentSystems, sampleCharacterSets, ["Commodore"]);

    expect(result).toContain("C64");
    expect(result).not.toContain("Apple II");
    expect(result).not.toContain("Atari 800");
  });

  it("keeps systems matching any of the manufacturers", () => {
    const currentSystems = ["C64", "Apple II", "Atari 800"];
    const result = filterInvalidSystems(currentSystems, sampleCharacterSets, ["Commodore", "Apple"]);

    expect(result).toContain("C64");
    expect(result).toContain("Apple II");
    expect(result).not.toContain("Atari 800");
  });

  it("returns empty array when all systems are invalid", () => {
    const currentSystems = ["C64", "Apple II"];
    const result = filterInvalidSystems(currentSystems, sampleCharacterSets, ["Atari"]);

    expect(result).not.toContain("C64");
    expect(result).not.toContain("Apple II");
  });

  it("handles empty current systems array", () => {
    const result = filterInvalidSystems([], sampleCharacterSets, ["Commodore"]);
    expect(result).toEqual([]);
  });

  it("handles systems not in the data set", () => {
    const currentSystems = ["C64", "NonExistentSystem"];
    const result = filterInvalidSystems(currentSystems, sampleCharacterSets, ["Commodore"]);

    expect(result).toContain("C64");
    expect(result).not.toContain("NonExistentSystem");
  });
});

// ============================================================================
// Edge Cases and Integration
// ============================================================================

describe("Edge Cases", () => {
  it("handles character sets with all optional fields empty", () => {
    const emptyMetadataSet = createMockSerializedCharacterSet({
      metadata: {
        name: "Minimal Set",
        description: "",
        source: "",
        manufacturer: "",
        system: "",
        chip: "",
        locale: "",
      },
    });

    expect(matchesSearchQuery(emptyMetadataSet, "Minimal")).toBe(true);
    expect(matchesManufacturerFilter(emptyMetadataSet, ["Commodore"])).toBe(false);
    expect(matchesManufacturerFilter(emptyMetadataSet, [])).toBe(true);
  });

  it("handles special characters in search query", () => {
    expect(matchesSearchQuery(commodore64CharacterSet, "901225-01")).toBe(true);
    expect(matchesSearchQuery(commodore64CharacterSet, "64 US")).toBe(true);
  });

  it("handles unicode characters in search", () => {
    const unicodeSet = createMockSerializedCharacterSet({
      metadata: {
        name: "Test Set with umlauts",
        description: "Contains umlauts",
        locale: "German",
      },
    });

    expect(matchesSearchQuery(unicodeSet, "umlauts")).toBe(true);
  });

  it("handles very long filter arrays", () => {
    const manyManufacturers = Array.from({ length: 100 }, (_, i) => `Manufacturer${i}`);
    manyManufacturers.push("Commodore");

    expect(matchesManufacturerFilter(commodore64CharacterSet, manyManufacturers)).toBe(true);
  });

  it("handles concurrent filter operations", () => {
    // Verify that filtering is deterministic
    const result1 = filterCharacterSets(sampleCharacterSets, complexFilter);
    const result2 = filterCharacterSets(sampleCharacterSets, complexFilter);

    expect(result1).toEqual(result2);
  });
});

// ============================================================================
// Pagination
// ============================================================================

describe("paginateItems", () => {
  // Create test data
  const testItems = Array.from({ length: 75 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  describe("basic pagination", () => {
    it("returns first page of items with correct metadata", () => {
      const result = paginateItems(testItems, 1, 20);

      expect(result.items).toHaveLength(20);
      expect(result.items[0]).toEqual({ id: 1, name: "Item 1" });
      expect(result.items[19]).toEqual({ id: 20, name: "Item 20" });
      expect(result.totalItems).toBe(75);
      expect(result.totalPages).toBe(4);
      expect(result.currentPage).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
    });

    it("returns second page of items", () => {
      const result = paginateItems(testItems, 2, 20);

      expect(result.items).toHaveLength(20);
      expect(result.items[0]).toEqual({ id: 21, name: "Item 21" });
      expect(result.items[19]).toEqual({ id: 40, name: "Item 40" });
      expect(result.currentPage).toBe(2);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });

    it("returns last page with partial items", () => {
      const result = paginateItems(testItems, 4, 20);

      expect(result.items).toHaveLength(15); // 75 - 60 = 15 remaining
      expect(result.items[0]).toEqual({ id: 61, name: "Item 61" });
      expect(result.items[14]).toEqual({ id: 75, name: "Item 75" });
      expect(result.currentPage).toBe(4);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });
  });

  describe("page size options", () => {
    it("handles 50 items per page", () => {
      const result = paginateItems(testItems, 1, 50);

      expect(result.items).toHaveLength(50);
      expect(result.totalPages).toBe(2);
      expect(result.pageSize).toBe(50);
    });

    it("handles 100 items per page", () => {
      const result = paginateItems(testItems, 1, 100);

      expect(result.items).toHaveLength(75); // All items fit on one page
      expect(result.totalPages).toBe(1);
      expect(result.pageSize).toBe(100);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });
  });

  describe("all option", () => {
    it("returns all items when pageSize is 'all'", () => {
      const result = paginateItems(testItems, 1, "all");

      expect(result.items).toHaveLength(75);
      expect(result.items).toEqual(testItems);
      expect(result.totalItems).toBe(75);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.pageSize).toBe("all");
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it("ignores currentPage when pageSize is 'all'", () => {
      const result = paginateItems(testItems, 5, "all");

      expect(result.items).toHaveLength(75);
      expect(result.currentPage).toBe(1);
    });

    it("works with empty array and 'all' pageSize", () => {
      const result = paginateItems([], 1, "all");

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("handles empty array", () => {
      const result = paginateItems([], 1, 20);

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it("clamps page to valid range when page is 0", () => {
      const result = paginateItems(testItems, 0, 20);

      expect(result.currentPage).toBe(1);
      expect(result.items[0]).toEqual({ id: 1, name: "Item 1" });
    });

    it("clamps page to valid range when page is negative", () => {
      const result = paginateItems(testItems, -5, 20);

      expect(result.currentPage).toBe(1);
      expect(result.items[0]).toEqual({ id: 1, name: "Item 1" });
    });

    it("clamps page to valid range when page exceeds total", () => {
      const result = paginateItems(testItems, 100, 20);

      expect(result.currentPage).toBe(4); // Last valid page
      expect(result.items[0]).toEqual({ id: 61, name: "Item 61" });
    });

    it("handles single item", () => {
      const result = paginateItems([{ id: 1 }], 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("handles exact page boundary", () => {
      const exactItems = Array.from({ length: 40 }, (_, i) => ({ id: i + 1 }));
      const result = paginateItems(exactItems, 2, 20);

      expect(result.items).toHaveLength(20);
      expect(result.totalPages).toBe(2);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });
  });
});

describe("parsePageSize", () => {
  it("returns default page size for null value", () => {
    expect(parsePageSize(null)).toBe(DEFAULT_PAGE_SIZE);
  });

  it("returns default page size for empty string", () => {
    expect(parsePageSize("")).toBe(DEFAULT_PAGE_SIZE);
  });

  it("parses valid numeric page sizes", () => {
    expect(parsePageSize("20")).toBe(20);
    expect(parsePageSize("50")).toBe(50);
    expect(parsePageSize("100")).toBe(100);
  });

  it("parses 'all' string", () => {
    expect(parsePageSize("all")).toBe("all");
  });

  it("returns default for invalid numeric values", () => {
    expect(parsePageSize("25")).toBe(DEFAULT_PAGE_SIZE); // Not in options
    expect(parsePageSize("0")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePageSize("-1")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePageSize("999")).toBe(DEFAULT_PAGE_SIZE);
  });

  it("returns default for non-numeric strings", () => {
    expect(parsePageSize("abc")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePageSize("twenty")).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe("PAGE_SIZE_OPTIONS", () => {
  it("contains expected values", () => {
    expect(PAGE_SIZE_OPTIONS).toContain(20);
    expect(PAGE_SIZE_OPTIONS).toContain(50);
    expect(PAGE_SIZE_OPTIONS).toContain(100);
    expect(PAGE_SIZE_OPTIONS).toContain("all");
  });

  it("has 4 options", () => {
    expect(PAGE_SIZE_OPTIONS).toHaveLength(4);
  });
});

describe("DEFAULT_PAGE_SIZE", () => {
  it("is a valid page size option", () => {
    expect(PAGE_SIZE_OPTIONS).toContain(DEFAULT_PAGE_SIZE);
  });

  it("is 20", () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
  });
});
