"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ToolLayout, ToolContent } from "@/components/layout/ToolLayout";
import { useCharacterLibrary } from "@/hooks/character-editor/useCharacterLibrary";
import { LibraryFilters } from "@/components/character-editor/library/LibraryFilters";
import { LibraryGridEmptyResults, LibraryGridError } from "@/components/character-editor/library/LibraryGrid";
import { CharacterPreview } from "@/components/character-editor/character/CharacterPreview";
import { SerializedCharacterSet } from "@/lib/character-editor/types";
import { deserializeCharacterSet } from "@/lib/character-editor/import/binary";
import { formatSize } from "@/lib/character-editor/utils";
import {
  type SortField,
  type SortDirection,
  type LibraryFilterState,
  type IsPinnedFilterValue,
  type OriginFilterValue,
  createEmptyFilterState,
  filterAndSortCharacterSets,
  getAvailableManufacturers,
  getAvailableSystems,
  getAvailableChips,
  getAvailableLocales,
  getAvailableCharacterCounts,
  getAvailableTags,
  getAvailableSources,
  getAvailableOrigins,
} from "@/lib/character-editor/library/filters";
import { useToast } from "@/hooks/useToast";

/**
 * Export format for JSON file
 */
interface ExportData {
  version: number;
  exportedAt: string;
  count: number;
  characterSets: SerializedCharacterSet[];
}

/**
 * Hidden route for exporting multiple character sets to JSON
 */
export function ExportAllView() {
  const router = useRouter();
  const { characterSets, loading, error, refresh } = useCharacterLibrary();
  const { showToast } = useToast();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filters, setFilters] = useState<LibraryFilterState>(createEmptyFilterState);
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Export state
  const [exporting, setExporting] = useState(false);

  // Filtered and sorted character sets
  const filteredSets = useMemo(() => {
    return filterAndSortCharacterSets(characterSets, filters, sortField, sortDirection);
  }, [characterSets, filters, sortField, sortDirection]);

  // Get available filter values
  const availableSizes = useMemo(() => {
    const sizes = new Map<string, { width: number; height: number }>();
    for (const set of characterSets) {
      const key = `${set.config.width}x${set.config.height}`;
      if (!sizes.has(key)) {
        sizes.set(key, { width: set.config.width, height: set.config.height });
      }
    }
    return Array.from(sizes.values());
  }, [characterSets]);

  const availableManufacturers = useMemo(() => getAvailableManufacturers(characterSets), [characterSets]);
  const availableSystems = useMemo(() => getAvailableSystems(characterSets), [characterSets]);
  const availableChips = useMemo(() => getAvailableChips(characterSets), [characterSets]);
  const availableLocales = useMemo(() => getAvailableLocales(characterSets), [characterSets]);
  const availableCharacterCounts = useMemo(() => getAvailableCharacterCounts(characterSets), [characterSets]);
  const availableTags = useMemo(() => getAvailableTags(characterSets), [characterSets]);
  const availableSources = useMemo(() => getAvailableSources(characterSets), [characterSets]);
  const availableOrigins = useMemo(() => getAvailableOrigins(characterSets), [characterSets]);

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredSets.map((set) => set.metadata.id)));
  }, [filteredSets]);

  const selectNone = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectFiltered = useCallback(() => {
    // Add all filtered items to selection (union)
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const set of filteredSets) {
        next.add(set.metadata.id);
      }
      return next;
    });
  }, [filteredSets]);

  // Filter handlers
  const handleSearchChange = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const handleSizeFilterChange = useCallback((widths: number[], heights: number[]) => {
    setFilters((prev) => ({ ...prev, widthFilters: widths, heightFilters: heights }));
  }, []);

  const handleCharacterCountFilterChange = useCallback((counts: number[]) => {
    setFilters((prev) => ({ ...prev, characterCountFilters: counts }));
  }, []);

  const handleManufacturerFilterChange = useCallback((manufacturers: string[]) => {
    setFilters((prev) => ({ ...prev, manufacturerFilters: manufacturers }));
  }, []);

  const handleSystemFilterChange = useCallback((systems: string[]) => {
    setFilters((prev) => ({ ...prev, systemFilters: systems }));
  }, []);

  const handleChipFilterChange = useCallback((chips: string[]) => {
    setFilters((prev) => ({ ...prev, chipFilters: chips }));
  }, []);

  const handleLocaleFilterChange = useCallback((locales: string[]) => {
    setFilters((prev) => ({ ...prev, localeFilters: locales }));
  }, []);

  const handleTagFilterChange = useCallback((tags: string[]) => {
    setFilters((prev) => ({ ...prev, tagFilters: tags }));
  }, []);

  const handleSourceFilterChange = useCallback((sources: string[]) => {
    setFilters((prev) => ({ ...prev, sourceFilters: sources }));
  }, []);

  const handleIsPinnedFiltersChange = useCallback((values: IsPinnedFilterValue[]) => {
    setFilters((prev) => ({ ...prev, isPinnedFilters: values }));
  }, []);

  const handleOriginFilterChange = useCallback((values: OriginFilterValue[]) => {
    setFilters((prev) => ({ ...prev, originFilters: values }));
  }, []);

  const handleSortFieldChange = useCallback((field: SortField) => {
    setSortField(field);
  }, []);

  const handleSortDirectionToggle = useCallback(() => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  // Export handler
  const handleExport = useCallback(async () => {
    if (selectedIds.size === 0) {
      showToast("No character sets selected", "warning");
      return;
    }

    setExporting(true);
    try {
      // Get selected character sets in the order they appear in the filtered list
      const selectedSets = characterSets.filter((set) => selectedIds.has(set.metadata.id));

      // Create export data
      const exportData: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        count: selectedSets.length,
        characterSets: selectedSets,
      };

      // Create JSON blob and download
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `character-sets-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Exported ${selectedSets.length} character set${selectedSets.length !== 1 ? "s" : ""}`, "success");
    } catch (err) {
      console.error("Export failed:", err);
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
    }
  }, [selectedIds, characterSets, showToast]);

  // Count selected from filtered
  const selectedFromFiltered = useMemo(() => {
    return filteredSets.filter((set) => selectedIds.has(set.metadata.id)).length;
  }, [filteredSets, selectedIds]);

  // Calculate total size estimate
  const totalSizeEstimate = useMemo(() => {
    const selectedSets = characterSets.filter((set) => selectedIds.has(set.metadata.id));
    let totalBytes = 0;
    for (const set of selectedSets) {
      // Rough estimate: JSON metadata + base64 binary data
      totalBytes += set.binaryData.length + JSON.stringify(set.metadata).length + JSON.stringify(set.config).length;
    }
    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [selectedIds, characterSets]);

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col gap-6 p-4">
      {/* Export info */}
      <div className="p-4 bg-retro-navy/30 rounded-lg border border-retro-grid/30">
        <h3 className="text-sm font-medium text-retro-cyan mb-3">Export Info</h3>
        <div className="flex flex-col gap-2 text-xs text-gray-400">
          <p>
            Export format: <span className="text-gray-300">JSON</span>
          </p>
          <p>
            Includes metadata, configuration, and binary data (base64 encoded).
          </p>
          <p className="mt-2 text-gray-500">
            The exported JSON file can be imported back into the character editor.
          </p>
        </div>
      </div>

      {/* Selection summary */}
      {selectedIds.size > 0 && (
        <div className="p-4 bg-retro-navy/30 rounded-lg border border-retro-grid/30">
          <h3 className="text-sm font-medium text-retro-cyan mb-3">Selection Summary</h3>
          <div className="flex flex-col gap-1 text-xs text-gray-400">
            <p>
              Total: <span className="text-gray-300">{selectedIds.size} character sets</span>
            </p>
            <p>
              Est. file size: <span className="text-gray-300">{totalSizeEstimate}</span>
            </p>
          </div>
        </div>
      )}

      {/* Hidden route notice */}
      <div className="p-4 bg-retro-amber/10 rounded-lg border border-retro-amber/30">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-retro-amber flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-xs text-retro-amber/80">
            <p className="font-medium mb-1">Developer Tool</p>
            <p>This is a hidden export route for bulk exporting character sets. Not linked in navigation.</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <ToolLayout title="Export Character Sets">
        <ToolContent>
          <LibraryGridError error={error} onRetry={refresh} />
        </ToolContent>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="Export Character Sets">
      <ToolContent
        rightSidebar={sidebarContent}
        rightSidebarWidth="280px"
        rightSidebarTitle="Export Info"
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-retro-cyan">Export Character Sets</h1>
              <p className="text-sm text-gray-400 mt-1">
                Select character sets to export to a single JSON file
              </p>
            </div>
            <button
              onClick={() => router.push("/tools/character-rom-editor")}
              className="px-4 py-2 text-sm border border-retro-grid/50 text-gray-400 rounded hover:text-gray-200 hover:border-retro-grid transition-colors"
            >
              Back to Library
            </button>
          </div>

          {/* Filters */}
          <LibraryFilters
            searchQuery={filters.searchQuery}
            onSearchChange={handleSearchChange}
            availableSizes={availableSizes}
            widthFilters={filters.widthFilters}
            heightFilters={filters.heightFilters}
            onSizeFilterChange={handleSizeFilterChange}
            availableCharacterCounts={availableCharacterCounts}
            characterCountFilters={filters.characterCountFilters}
            onCharacterCountFilterChange={handleCharacterCountFilterChange}
            availableManufacturers={availableManufacturers}
            availableSystems={availableSystems}
            manufacturerFilters={filters.manufacturerFilters}
            systemFilters={filters.systemFilters}
            onManufacturerFilterChange={handleManufacturerFilterChange}
            onSystemFilterChange={handleSystemFilterChange}
            availableChips={availableChips}
            chipFilters={filters.chipFilters}
            onChipFilterChange={handleChipFilterChange}
            availableLocales={availableLocales}
            localeFilters={filters.localeFilters}
            onLocaleFilterChange={handleLocaleFilterChange}
            availableTags={availableTags}
            tagFilters={filters.tagFilters}
            onTagFilterChange={handleTagFilterChange}
            availableSources={availableSources}
            sourceFilters={filters.sourceFilters}
            onSourceFilterChange={handleSourceFilterChange}
            isPinnedFilters={filters.isPinnedFilters}
            onIsPinnedFiltersChange={handleIsPinnedFiltersChange}
            availableOrigins={availableOrigins}
            originFilters={filters.originFilters}
            onOriginFilterChange={handleOriginFilterChange}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortFieldChange={handleSortFieldChange}
            onSortDirectionToggle={handleSortDirectionToggle}
            totalCount={characterSets.length}
            filteredCount={filteredSets.length}
          />

          {/* Selection controls */}
          <div className="flex items-center justify-between py-3 px-4 bg-retro-navy/30 rounded-lg border border-retro-grid/30">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                <span className="text-retro-cyan font-medium">{selectedIds.size}</span> selected
                {selectedFromFiltered !== selectedIds.size && (
                  <span className="text-gray-500"> ({selectedFromFiltered} shown)</span>
                )}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-xs bg-retro-cyan/20 text-retro-cyan rounded hover:bg-retro-cyan/30 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={selectFiltered}
                  className="px-3 py-1.5 text-xs bg-retro-violet/20 text-retro-violet rounded hover:bg-retro-violet/30 transition-colors"
                  title="Add all filtered items to selection"
                >
                  Add Filtered
                </button>
                <button
                  onClick={selectNone}
                  className="px-3 py-1.5 text-xs bg-retro-grid/30 text-gray-400 rounded hover:bg-retro-grid/50 hover:text-gray-200 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {selectedIds.size > 0 && (
                <span className="text-xs text-gray-500">
                  Est. size: {totalSizeEstimate}
                </span>
              )}
              <button
                onClick={handleExport}
                disabled={selectedIds.size === 0 || exporting}
                className="px-4 py-2 text-sm bg-retro-amber/20 text-retro-amber rounded transition-all shadow-[0_0_8px_rgba(255,184,0,0.25)] hover:bg-retro-amber hover:text-retro-dark hover:shadow-[0_0_8px_var(--retro-amber),0_0_15px_var(--retro-amber),0_0_30px_var(--retro-amber)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-retro-amber/20 disabled:hover:text-retro-amber disabled:hover:shadow-[0_0_8px_rgba(255,184,0,0.25)]"
              >
                {exporting ? "Exporting..." : `Export ${selectedIds.size > 0 ? `(${selectedIds.size})` : ""}`}
              </button>
            </div>
          </div>

          {/* Character set list */}
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-retro-navy/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredSets.length === 0 ? (
            <LibraryGridEmptyResults
              onClearFilters={() => setFilters(createEmptyFilterState())}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSets.map((set) => (
                <SelectableCharacterSetRow
                  key={set.metadata.id}
                  characterSet={set}
                  selected={selectedIds.has(set.metadata.id)}
                  onToggle={() => toggleSelection(set.metadata.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ToolContent>
    </ToolLayout>
  );
}

/**
 * Selectable row for a character set
 */
function SelectableCharacterSetRow({
  characterSet,
  selected,
  onToggle,
}: {
  characterSet: SerializedCharacterSet;
  selected: boolean;
  onToggle: () => void;
}) {
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

  return (
    <button
      onClick={onToggle}
      className={`
        w-full p-3 rounded-lg border text-left transition-all flex items-center gap-4
        ${
          selected
            ? "border-retro-cyan bg-retro-cyan/10"
            : "border-retro-grid/30 bg-retro-navy/30 hover:border-retro-grid/50"
        }
      `}
    >
      {/* Checkbox */}
      <div
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
          ${selected ? "border-retro-cyan bg-retro-cyan" : "border-gray-500"}
        `}
      >
        {selected && (
          <svg className="w-3 h-3 text-retro-dark" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        )}
      </div>

      {/* Preview */}
      <div className="flex-shrink-0 bg-black/30 p-1 rounded">
        <CharacterPreview characters={characters} config={config} maxCharacters={8} maxWidth={48} maxHeight={24} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200 truncate">{metadata.name}</span>
          {metadata.isBuiltIn && (
            <span className="px-1.5 py-0.5 text-[10px] bg-retro-navy text-gray-400 rounded">Built-in</span>
          )}
          {metadata.isPinned && (
            <svg className="w-3.5 h-3.5 text-retro-yellow flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
          )}
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">
          {formatSize(config)} - {characters.length} chars
          {metadata.manufacturer && ` - ${metadata.manufacturer}`}
          {metadata.system && ` ${metadata.system}`}
        </div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <svg className="w-5 h-5 text-retro-cyan flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      )}
    </button>
  );
}
