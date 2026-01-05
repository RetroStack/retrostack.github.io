"use client";

import { useState, useEffect } from "react";
import { CharacterSetMetadata } from "@/lib/character-editor";
import { ManufacturerSystemSelect } from "./ManufacturerSystemSelect";

export interface MetadataEditModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Current metadata */
  metadata: CharacterSetMetadata;
  /** Callback when metadata is saved */
  onSave: (metadata: Partial<CharacterSetMetadata>) => void;
}

/**
 * Modal for editing character set metadata
 */
export function MetadataEditModal({
  isOpen,
  onClose,
  metadata,
  onSave,
}: MetadataEditModalProps) {
  const [name, setName] = useState(metadata.name);
  const [description, setDescription] = useState(metadata.description);
  const [source, setSource] = useState(metadata.source);
  const [manufacturer, setManufacturer] = useState(metadata.manufacturer);
  const [system, setSystem] = useState(metadata.system);
  const [isPinned, setIsPinned] = useState(metadata.isPinned ?? false);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens with new metadata
  useEffect(() => {
    if (isOpen) {
      setName(metadata.name);
      setDescription(metadata.description);
      setSource(metadata.source);
      setManufacturer(metadata.manufacturer);
      setSystem(metadata.system);
      setIsPinned(metadata.isPinned ?? false);
    }
  }, [isOpen, metadata]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        source: source.trim() || "yourself",
        manufacturer: manufacturer,
        system: system,
        isPinned: isPinned,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-retro-grid/30">
          <h2 className="text-lg font-medium text-white">Edit Metadata</h2>
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
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Name <span className="text-retro-pink">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character set name"
              className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan resize-none"
            />
          </div>

          {/* Manufacturer & System */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Manufacturer & System</label>
            <ManufacturerSystemSelect
              manufacturer={manufacturer}
              system={system}
              onManufacturerChange={setManufacturer}
              onSystemChange={setSystem}
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Source / Attribution</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="yourself"
              className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
            />
          </div>

          {/* Pinned toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm text-gray-300">Pin to top</label>
              <p className="text-xs text-gray-500">Pinned items appear first in search results</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-retro-cyan focus:ring-offset-2 focus:ring-offset-retro-dark ${
                isPinned ? "bg-retro-pink border-retro-pink" : "bg-retro-purple/50 border-retro-purple"
              }`}
              role="switch"
              aria-checked={isPinned}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                  isPinned ? "translate-x-5 bg-white" : "translate-x-0 bg-gray-400"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-retro-grid/30">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
