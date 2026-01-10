"use client";

import { useState, useEffect } from "react";
import { CharacterSetMetadata } from "@/lib/character-editor/types";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Modal, ModalHeader, ModalContent, ModalActions } from "@/components/ui/Modal";
import { MetadataFormFields } from "@/components/character-editor/import/MetadataFormFields";

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
export function MetadataEditModal({ isOpen, onClose, metadata, onSave }: MetadataEditModalProps) {
  const [name, setName] = useState(metadata.name);
  const [description, setDescription] = useState(metadata.description);
  const [source, setSource] = useState(metadata.source);
  const [manufacturer, setManufacturer] = useState(metadata.manufacturer);
  const [system, setSystem] = useState(metadata.system);
  const [chip, setChip] = useState(metadata.chip);
  const [locale, setLocale] = useState(metadata.locale);
  const [tags, setTags] = useState<string[]>(metadata.tags ?? []);
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
      setChip(metadata.chip);
      setLocale(metadata.locale);
      setTags(metadata.tags ?? []);
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
        chip: chip,
        locale: locale.trim(),
        tags: tags,
        isPinned: isPinned,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader onClose={onClose} showCloseButton>
        <h2 className="text-lg font-medium text-white">Edit Metadata</h2>
      </ModalHeader>

      <ModalContent>
        <MetadataFormFields
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          manufacturer={manufacturer}
          onManufacturerChange={setManufacturer}
          system={system}
          onSystemChange={setSystem}
          chip={chip}
          onChipChange={setChip}
          locale={locale}
          onLocaleChange={setLocale}
          source={source}
          onSourceChange={setSource}
          tags={tags}
          onTagsChange={setTags}
          autoFocusName
          compact
          idPrefix="metadata-edit"
        />

        {/* Pinned toggle - unique to this modal */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <label className="block text-sm text-gray-300">Pin to top</label>
            <p className="text-xs text-gray-500">Pinned items appear first in search results</p>
          </div>
          <ToggleSwitch
            checked={isPinned}
            onChange={setIsPinned}
          />
        </div>
      </ModalContent>

      <ModalActions
        onCancel={onClose}
        onConfirm={handleSave}
        confirmLabel={saving ? "Saving..." : "Save"}
        confirmDisabled={!name.trim() || saving}
      />
    </Modal>
  );
}
