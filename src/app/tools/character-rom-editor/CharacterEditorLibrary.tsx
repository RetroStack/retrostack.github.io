"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NeonText } from "@/components/effects/NeonText";
import {
  LibraryGrid,
  LibraryGridEmptyResults,
  LibraryGridError,
  LibraryFilters,
  OnboardingTour,
} from "@/components/character-editor";
import { Tooltip } from "@/components/ui/Tooltip";
import { useCharacterLibrary } from "@/hooks/character-editor";
import { useToast } from "@/hooks/useToast";
import { useOnboarding, CHARACTER_EDITOR_ONBOARDING_STEPS } from "@/hooks";
import { getCharacterCount } from "@/lib/character-editor/types";

/**
 * Main library view for the Character ROM Editor
 */
export function CharacterEditorLibrary() {
  const router = useRouter();
  const toast = useToast();
  const {
    characterSets,
    loading,
    error,
    refresh,
    deleteSet,
    saveAs,
    rename,
    togglePinned,
    availableSizes,
    getById,
  } = useCharacterLibrary();

  // Onboarding tour
  const onboarding = useOnboarding({
    steps: CHARACTER_EDITOR_ONBOARDING_STEPS,
    enabled: true,
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [widthFilters, setWidthFilters] = useState<number[]>([]);
  const [heightFilters, setHeightFilters] = useState<number[]>([]);
  const [characterCountFilters, setCharacterCountFilters] = useState<number[]>([]);
  const [manufacturerFilters, setManufacturerFilters] = useState<string[]>([]);
  const [systemFilters, setSystemFilters] = useState<string[]>([]);
  const [localeFilters, setLocaleFilters] = useState<string[]>([]);

  // Get available manufacturers and systems from character sets
  const availableManufacturers = useMemo(() => {
    const manufacturers = new Set<string>();
    characterSets.forEach((set) => {
      if (set.metadata.manufacturer) manufacturers.add(set.metadata.manufacturer);
    });
    return Array.from(manufacturers).sort();
  }, [characterSets]);

  const availableSystems = useMemo(() => {
    const systems = new Set<string>();
    characterSets.forEach((set) => {
      if (set.metadata.system) systems.add(set.metadata.system);
    });
    return Array.from(systems).sort();
  }, [characterSets]);

  const availableLocales = useMemo(() => {
    const locales = new Set<string>();
    characterSets.forEach((set) => {
      if (set.metadata.locale) locales.add(set.metadata.locale);
    });
    return Array.from(locales).sort();
  }, [characterSets]);

  const availableCharacterCounts = useMemo(() => {
    const counts = new Set<number>();
    characterSets.forEach((set) => {
      counts.add(getCharacterCount(set));
    });
    return Array.from(counts).sort((a, b) => a - b);
  }, [characterSets]);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rename state
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Filter character sets
  const filteredSets = useMemo(() => {
    let result = characterSets;

    // Apply search filter (full-text search across all fields)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (set) =>
          set.metadata.name.toLowerCase().includes(query) ||
          set.metadata.description.toLowerCase().includes(query) ||
          set.metadata.source.toLowerCase().includes(query) ||
          (set.metadata.manufacturer && set.metadata.manufacturer.toLowerCase().includes(query)) ||
          (set.metadata.system && set.metadata.system.toLowerCase().includes(query))
      );
    }

    // Apply size filters (OR logic - match any selected)
    if (widthFilters.length > 0) {
      result = result.filter((set) => widthFilters.includes(set.config.width));
    }
    if (heightFilters.length > 0) {
      result = result.filter((set) => heightFilters.includes(set.config.height));
    }

    // Apply manufacturer filter (OR logic)
    if (manufacturerFilters.length > 0) {
      result = result.filter(
        (set) => set.metadata.manufacturer && manufacturerFilters.includes(set.metadata.manufacturer)
      );
    }

    // Apply system filter (OR logic)
    if (systemFilters.length > 0) {
      result = result.filter(
        (set) => set.metadata.system && systemFilters.includes(set.metadata.system)
      );
    }

    // Apply locale filter (OR logic)
    if (localeFilters.length > 0) {
      result = result.filter(
        (set) => set.metadata.locale && localeFilters.includes(set.metadata.locale)
      );
    }

    // Apply character count filter (OR logic)
    if (characterCountFilters.length > 0) {
      result = result.filter(
        (set) => characterCountFilters.includes(getCharacterCount(set))
      );
    }

    // Sort with pinned items first, then by updated date
    return [...result].sort((a, b) => {
      const aPinned = a.metadata.isPinned ? 1 : 0;
      const bPinned = b.metadata.isPinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return b.metadata.updatedAt - a.metadata.updatedAt;
    });
  }, [characterSets, searchQuery, widthFilters, heightFilters, characterCountFilters, manufacturerFilters, systemFilters, localeFilters]);

  // Handlers
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/tools/character-rom-editor/edit?id=${id}`);
    },
    [router]
  );

  const handleExport = useCallback(
    (id: string) => {
      router.push(`/tools/character-rom-editor/export?id=${id}`);
    },
    [router]
  );

  const handleDelete = useCallback(async (id: string) => {
    setDeleteId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await deleteSet(deleteId);
      toast.success("Character set deleted");
    } catch (e) {
      console.error("Failed to delete:", e);
      toast.error("Failed to delete character set");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, deleteSet, toast]);

  const handleDuplicate = useCallback(
    async (id: string) => {
      try {
        const characterSet = await getById(id);
        if (characterSet) {
          const newName = `${characterSet.metadata.name} (Copy)`;
          const newId = await saveAs(characterSet, newName);
          toast.success("Character set duplicated");
          router.push(`/tools/character-rom-editor/edit?id=${newId}`);
        }
      } catch (e) {
        console.error("Failed to duplicate:", e);
        toast.error("Failed to duplicate character set");
      }
    },
    [getById, saveAs, router, toast]
  );

  const handleImport = useCallback(() => {
    router.push("/tools/character-rom-editor/import");
  }, [router]);

  const handleCreate = useCallback(() => {
    router.push("/tools/character-rom-editor/add");
  }, [router]);

  const handleRename = useCallback((id: string) => {
    const set = characterSets.find((s) => s.metadata.id === id);
    if (set) {
      setRenameId(id);
      setRenameName(set.metadata.name);
    }
  }, [characterSets]);

  const handleTogglePinned = useCallback(async (id: string) => {
    try {
      await togglePinned(id);
    } catch (e) {
      console.error("Failed to toggle pinned:", e);
    }
  }, [togglePinned]);

  const confirmRename = useCallback(async () => {
    if (!renameId || !renameName.trim()) return;

    try {
      setIsRenaming(true);
      await rename(renameId, renameName.trim());
      toast.success("Character set renamed");
    } catch (e) {
      console.error("Failed to rename:", e);
      toast.error("Failed to rename character set");
    } finally {
      setIsRenaming(false);
      setRenameId(null);
      setRenameName("");
    }
  }, [renameId, renameName, rename, toast]);

  const handleSizeFilterChange = useCallback(
    (widths: number[], heights: number[]) => {
      setWidthFilters(widths);
      setHeightFilters(heights);
    },
    []
  );

  const handleManufacturerFilterChange = useCallback((manufacturers: string[]) => {
    setManufacturerFilters(manufacturers);
  }, []);

  const handleSystemFilterChange = useCallback((systems: string[]) => {
    setSystemFilters(systems);
  }, []);

  const handleLocaleFilterChange = useCallback((locales: string[]) => {
    setLocaleFilters(locales);
  }, []);

  const handleCharacterCountFilterChange = useCallback((counts: number[]) => {
    setCharacterCountFilters(counts);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setWidthFilters([]);
    setHeightFilters([]);
    setCharacterCountFilters([]);
    setManufacturerFilters([]);
    setSystemFilters([]);
    setLocaleFilters([]);
  }, []);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    widthFilters.length > 0 ||
    heightFilters.length > 0 ||
    characterCountFilters.length > 0 ||
    manufacturerFilters.length > 0 ||
    systemFilters.length > 0 ||
    localeFilters.length > 0;

  // Find the set being deleted for confirmation
  const setToDelete = deleteId
    ? characterSets.find((s) => s.metadata.id === deleteId)
    : null;

  // Find the set being renamed
  const setToRename = renameId
    ? characterSets.find((s) => s.metadata.id === renameId)
    : null;

  return (
    <div className="min-h-screen flex flex-col safe-top">
      <Header />

      <main className="flex-1 bg-retro-dark pt-24 pb-12">
        <Container>
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <Link
                href="/tools"
                className="text-xs text-gray-500 hover:text-retro-cyan transition-colors mb-2 inline-flex items-center gap-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Tools
              </Link>
              <h1 className="text-2xl sm:text-3xl font-display">
                <NeonText color="pink">Character ROM Editor</NeonText>
              </h1>
              <p className="text-sm text-gray-400 mt-2">
                Design, edit, and export character sets for vintage display
                systems
              </p>
            </div>

            <div className="flex gap-2">
              {onboarding.hasCompleted || onboarding.hasDismissed ? (
                <Tooltip content="Restart onboarding tour" position="bottom">
                  <button
                    onClick={onboarding.start}
                    className="text-xs text-gray-500 hover:text-retro-cyan transition-colors flex items-center mr-2"
                  >
                    <svg className="w-4 h-4 min-[1120px]:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden min-[1120px]:inline">Tour</span>
                  </button>
                </Tooltip>
              ) : null}
              <Tooltip content="Create a new character set from scratch" position="bottom">
                <Button href="/tools/character-rom-editor/add" variant="pink">
                  <svg className="w-4 h-4 min-[1120px]:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden min-[1120px]:inline">Add ROM</span>
                </Button>
              </Tooltip>
              <Tooltip content="Import from binary, image, font, or code" position="bottom">
                <Button href="/tools/character-rom-editor/import" variant="cyan">
                  <svg className="w-4 h-4 min-[1120px]:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="hidden min-[1120px]:inline">Import ROM</span>
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <LibraryFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              availableSizes={availableSizes}
              widthFilters={widthFilters}
              heightFilters={heightFilters}
              onSizeFilterChange={handleSizeFilterChange}
              availableCharacterCounts={availableCharacterCounts}
              characterCountFilters={characterCountFilters}
              onCharacterCountFilterChange={handleCharacterCountFilterChange}
              availableManufacturers={availableManufacturers}
              availableSystems={availableSystems}
              manufacturerFilters={manufacturerFilters}
              systemFilters={systemFilters}
              onManufacturerFilterChange={handleManufacturerFilterChange}
              onSystemFilterChange={handleSystemFilterChange}
              availableLocales={availableLocales}
              localeFilters={localeFilters}
              onLocaleFilterChange={handleLocaleFilterChange}
              totalCount={characterSets.length}
              filteredCount={filteredSets.length}
            />
          </div>

          {/* Content */}
          {error ? (
            <LibraryGridError error={error} onRetry={refresh} />
          ) : hasActiveFilters && filteredSets.length === 0 ? (
            <LibraryGridEmptyResults onClearFilters={handleClearFilters} />
          ) : (
            <LibraryGrid
              characterSets={filteredSets}
              loading={loading}
              onEdit={handleEdit}
              onExport={handleExport}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onRename={handleRename}
              onTogglePinned={handleTogglePinned}
              onImport={handleImport}
              onCreate={handleCreate}
            />
          )}
        </Container>
      </main>

      <Footer />

      {/* Delete confirmation modal */}
      {deleteId && setToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />

          {/* Modal */}
          <div className="relative bg-retro-navy border border-retro-grid/50 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-semibold text-gray-200 mb-2">
              Delete Character Set
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Are you sure you want to delete &quot;{setToDelete.metadata.name}
              &quot;? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename modal */}
      {renameId && setToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setRenameId(null);
              setRenameName("");
            }}
          />

          {/* Modal */}
          <div className="relative bg-retro-navy border border-retro-grid/50 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">
              Rename Character Set
            </h2>

            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameName.trim()) {
                  confirmRename();
                } else if (e.key === "Escape") {
                  setRenameId(null);
                  setRenameName("");
                }
              }}
              className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-gray-200 text-sm focus:outline-none focus:border-retro-cyan transition-colors"
              placeholder="Enter new name..."
              autoFocus
              disabled={isRenaming}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRenameId(null);
                  setRenameName("");
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                disabled={isRenaming}
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                className="px-4 py-2 text-sm bg-retro-cyan/20 text-retro-cyan rounded hover:bg-retro-cyan/30 transition-colors disabled:opacity-50"
                disabled={isRenaming || !renameName.trim()}
              >
                {isRenaming ? "Renaming..." : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding tour */}
      <OnboardingTour
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStepData}
        stepIndex={onboarding.currentStep}
        totalSteps={onboarding.totalSteps}
        isFirstStep={onboarding.isFirstStep}
        isLastStep={onboarding.isLastStep}
        onNext={onboarding.next}
        onPrev={onboarding.prev}
        onSkip={onboarding.skip}
      />
    </div>
  );
}
