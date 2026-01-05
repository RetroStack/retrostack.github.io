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
} from "@/components/character-editor";
import { useCharacterLibrary } from "@/hooks/character-editor";
import { SerializedCharacterSet } from "@/lib/character-editor";

/**
 * Main library view for the Character ROM Editor
 */
export function CharacterEditorLibrary() {
  const router = useRouter();
  const {
    characterSets,
    loading,
    error,
    refresh,
    deleteSet,
    saveAs,
    rename,
    availableSizes,
    getById,
  } = useCharacterLibrary();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [widthFilters, setWidthFilters] = useState<number[]>([]);
  const [heightFilters, setHeightFilters] = useState<number[]>([]);
  const [makerFilters, setMakerFilters] = useState<string[]>([]);
  const [systemFilters, setSystemFilters] = useState<string[]>([]);

  // Get available makers and systems from character sets
  const availableMakers = useMemo(() => {
    const makers = new Set<string>();
    characterSets.forEach((set) => {
      if (set.metadata.maker) makers.add(set.metadata.maker);
    });
    return Array.from(makers).sort();
  }, [characterSets]);

  const availableSystems = useMemo(() => {
    const systems = new Set<string>();
    characterSets.forEach((set) => {
      if (set.metadata.system) systems.add(set.metadata.system);
    });
    return Array.from(systems).sort();
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

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (set) =>
          set.metadata.name.toLowerCase().includes(query) ||
          set.metadata.description.toLowerCase().includes(query) ||
          set.metadata.source.toLowerCase().includes(query)
      );
    }

    // Apply size filters (OR logic - match any selected)
    if (widthFilters.length > 0) {
      result = result.filter((set) => widthFilters.includes(set.config.width));
    }
    if (heightFilters.length > 0) {
      result = result.filter((set) => heightFilters.includes(set.config.height));
    }

    // Apply maker filter (OR logic)
    if (makerFilters.length > 0) {
      result = result.filter(
        (set) => set.metadata.maker && makerFilters.includes(set.metadata.maker)
      );
    }

    // Apply system filter (OR logic)
    if (systemFilters.length > 0) {
      result = result.filter(
        (set) => set.metadata.system && systemFilters.includes(set.metadata.system)
      );
    }

    return result;
  }, [characterSets, searchQuery, widthFilters, heightFilters, makerFilters, systemFilters]);

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
    } catch (e) {
      console.error("Failed to delete:", e);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  }, [deleteId, deleteSet]);

  const handleDuplicate = useCallback(
    async (id: string) => {
      try {
        const characterSet = await getById(id);
        if (characterSet) {
          const newName = `${characterSet.metadata.name} (Copy)`;
          const newId = await saveAs(characterSet, newName);
          router.push(`/tools/character-rom-editor/edit?id=${newId}`);
        }
      } catch (e) {
        console.error("Failed to duplicate:", e);
      }
    },
    [getById, saveAs, router]
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

  const confirmRename = useCallback(async () => {
    if (!renameId || !renameName.trim()) return;

    try {
      setIsRenaming(true);
      await rename(renameId, renameName.trim());
    } catch (e) {
      console.error("Failed to rename:", e);
    } finally {
      setIsRenaming(false);
      setRenameId(null);
      setRenameName("");
    }
  }, [renameId, renameName, rename]);

  const handleSizeFilterChange = useCallback(
    (widths: number[], heights: number[]) => {
      setWidthFilters(widths);
      setHeightFilters(heights);
    },
    []
  );

  const handleMakerFilterChange = useCallback((makers: string[]) => {
    setMakerFilters(makers);
  }, []);

  const handleSystemFilterChange = useCallback((systems: string[]) => {
    setSystemFilters(systems);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setWidthFilters([]);
    setHeightFilters([]);
    setMakerFilters([]);
    setSystemFilters([]);
  }, []);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    widthFilters.length > 0 ||
    heightFilters.length > 0 ||
    makerFilters.length > 0 ||
    systemFilters.length > 0;

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
              <Button href="/tools/character-rom-editor/add" variant="pink">
                Add ROM
              </Button>
              <Button href="/tools/character-rom-editor/import" variant="cyan">
                Import ROM
              </Button>
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
              availableMakers={availableMakers}
              availableSystems={availableSystems}
              makerFilters={makerFilters}
              systemFilters={systemFilters}
              onMakerFilterChange={handleMakerFilterChange}
              onSystemFilterChange={handleSystemFilterChange}
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
    </div>
  );
}
