"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Character, CharacterSetConfig, formatTimestamp } from "@/lib/character-editor";
import { Snapshot } from "@/lib/character-editor/snapshots";
import { CharacterPreviewGrid } from "./CharacterGrid";

export interface SnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: Snapshot[];
  loading: boolean;
  isAtCapacity: boolean;
  maxSnapshots: number;
  currentCharacters: Character[];
  currentConfig: CharacterSetConfig;
  foregroundColor: string;
  backgroundColor: string;
  onSave: (name: string) => Promise<boolean>;
  onRestore: (snapshotId: string) => Promise<Character[] | null>;
  onDelete: (snapshotId: string) => Promise<boolean>;
  onRename: (snapshotId: string, newName: string) => Promise<boolean>;
  onRestoreApply: (characters: Character[]) => void;
}

/**
 * Modal for managing snapshots
 */
export function SnapshotsModal({
  isOpen,
  onClose,
  snapshots,
  loading,
  isAtCapacity,
  maxSnapshots,
  currentCharacters,
  currentConfig,
  foregroundColor,
  backgroundColor,
  onSave,
  onRestore,
  onDelete,
  onRename,
  onRestoreApply,
}: SnapshotsModalProps) {
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [previewCharacters, setPreviewCharacters] = useState<Character[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const timestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      setNewSnapshotName(`Snapshot - ${timestamp}`);
      setSelectedSnapshot(null);
      setPreviewCharacters(null);
      setEditingId(null);
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  // Handle save new snapshot
  const handleSave = useCallback(async () => {
    if (!newSnapshotName.trim()) return;

    setSaving(true);
    const success = await onSave(newSnapshotName.trim());
    setSaving(false);

    if (success) {
      const timestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      setNewSnapshotName(`Snapshot - ${timestamp}`);
    }
  }, [newSnapshotName, onSave]);

  // Handle select snapshot for preview
  const handleSelect = useCallback(
    async (snapshotId: string) => {
      if (selectedSnapshot === snapshotId) {
        setSelectedSnapshot(null);
        setPreviewCharacters(null);
        return;
      }

      setSelectedSnapshot(snapshotId);
      const characters = await onRestore(snapshotId);
      if (characters) {
        setPreviewCharacters(characters);
      }
    },
    [selectedSnapshot, onRestore]
  );

  // Handle restore
  const handleRestore = useCallback(() => {
    if (previewCharacters) {
      onRestoreApply(previewCharacters);
      onClose();
    }
  }, [previewCharacters, onRestoreApply, onClose]);

  // Handle delete
  const handleDelete = useCallback(
    async (snapshotId: string) => {
      await onDelete(snapshotId);
      if (selectedSnapshot === snapshotId) {
        setSelectedSnapshot(null);
        setPreviewCharacters(null);
      }
      setConfirmDeleteId(null);
    },
    [onDelete, selectedSnapshot]
  );

  // Handle rename
  const handleStartRename = useCallback((snapshot: Snapshot) => {
    setEditingId(snapshot.id);
    setEditingName(snapshot.name);
  }, []);

  const handleFinishRename = useCallback(async () => {
    if (editingId && editingName.trim()) {
      await onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  }, [editingId, editingName, onRename]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-retro-grid/30">
          <div>
            <h2 className="text-lg font-medium text-white">Snapshots</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Save and restore character set states ({snapshots.length}/{maxSnapshots})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Snapshots list */}
          <div className="flex-1 overflow-y-auto p-4 border-r border-retro-grid/30">
            {/* New snapshot form */}
            <div className="mb-4 p-3 bg-retro-dark/50 rounded border border-retro-grid/30">
              <label className="block text-xs text-gray-400 mb-1">Create New Snapshot</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  placeholder="Snapshot name"
                  className="flex-1 px-2 py-1.5 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSnapshotName.trim() && !isAtCapacity) {
                      handleSave();
                    }
                  }}
                />
                <Button
                  onClick={handleSave}
                  disabled={!newSnapshotName.trim() || saving || isAtCapacity}
                  variant="cyan"
                  size="sm"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
              {isAtCapacity && (
                <p className="text-xs text-orange-400 mt-1">
                  Maximum snapshots reached. Delete one to save a new one.
                </p>
              )}
            </div>

            {/* Snapshots list */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                <p className="text-sm">No snapshots yet</p>
                <p className="text-xs mt-1">Create one to save your progress</p>
              </div>
            ) : (
              <div className="space-y-2">
                {snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className={`p-3 rounded border transition-colors cursor-pointer ${
                      selectedSnapshot === snapshot.id
                        ? "bg-retro-cyan/10 border-retro-cyan"
                        : "bg-retro-dark/30 border-retro-grid/30 hover:border-retro-grid/50"
                    }`}
                    onClick={() => handleSelect(snapshot.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {editingId === snapshot.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-2 py-1 bg-retro-dark border border-retro-cyan rounded text-sm text-white focus:outline-none"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleFinishRename();
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            onBlur={handleFinishRename}
                          />
                        ) : (
                          <h3 className="text-sm text-white font-medium truncate">{snapshot.name}</h3>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(snapshot.createdAt)}
                          </span>
                          <span className="text-xs text-gray-600">|</span>
                          <span className="text-xs text-gray-500">
                            {snapshot.characterCount} chars
                          </span>
                          <span className="text-xs text-gray-600">|</span>
                          <span className="text-xs text-gray-500">
                            {snapshot.config.width}x{snapshot.config.height}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(snapshot);
                          }}
                          className="p-1 text-gray-500 hover:text-white transition-colors"
                          title="Rename"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {confirmDeleteId === snapshot.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDelete(snapshot.id)}
                              className="px-2 py-0.5 text-xs bg-red-500/20 border border-red-500 rounded text-red-400 hover:bg-red-500/30"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 text-xs border border-retro-grid/50 rounded text-gray-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(snapshot.id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview panel */}
          <div className="w-full md:w-72 p-4 bg-retro-dark/30 flex flex-col">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Preview</h3>
            {selectedSnapshot && previewCharacters ? (
              <>
                <div className="flex-1 overflow-auto bg-retro-dark rounded border border-retro-grid/30 p-2 mb-3">
                  <CharacterPreviewGrid
                    characters={previewCharacters.slice(0, 64)}
                    config={currentConfig}
                    foregroundColor={foregroundColor}
                    backgroundColor={backgroundColor}
                    smallScale={2}
                    maxCharacters={64}
                  />
                  {previewCharacters.length > 64 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      +{previewCharacters.length - 64} more characters
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRestore} variant="cyan" size="sm" className="flex-1">
                    Restore This Snapshot
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This will replace your current work
                </p>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <p className="text-sm">Select a snapshot to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current state preview */}
        <div className="p-4 border-t border-retro-grid/30 bg-retro-dark/30">
          <div className="flex items-center gap-4">
            <div>
              <h4 className="text-xs text-gray-400 mb-1">Current State</h4>
              <CharacterPreviewGrid
                characters={currentCharacters.slice(0, 16)}
                config={currentConfig}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                smallScale={2}
                maxCharacters={16}
              />
            </div>
            <div className="text-xs text-gray-500">
              <p>{currentCharacters.length} characters</p>
              <p>{currentConfig.width}x{currentConfig.height} px</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
