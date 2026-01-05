"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CharacterDisplay } from "./CharacterDisplay";
import { Character } from "@/lib/character-editor";

export interface ReorderModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Array of characters to reorder */
  characters: Character[];
  /** Callback when reorder is applied */
  onReorder: (newCharacters: Character[]) => void;
}

interface SortableCharacterProps {
  id: string;
  character: Character;
  index: number;
}

function SortableCharacter({ id, character, index }: SortableCharacterProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        p-1.5 rounded border-2 transition-all cursor-grab active:cursor-grabbing
        ${isDragging
          ? "border-retro-cyan bg-retro-cyan/20 opacity-50"
          : "border-retro-grid/30 hover:border-retro-grid/50"
        }
      `}
      title={`Character ${index}`}
    >
      <CharacterDisplay
        character={character}
        mode="small"
        smallScale={3}
      />
      <div className="text-[8px] text-gray-500 text-center mt-0.5">
        {index}
      </div>
    </div>
  );
}

function DragOverlayCharacter({ character }: { character: Character }) {
  return (
    <div className="p-1.5 rounded border-2 border-retro-cyan bg-retro-navy shadow-lg">
      <CharacterDisplay
        character={character}
        mode="small"
        smallScale={3}
      />
    </div>
  );
}

/**
 * Modal for reordering characters using drag-and-drop
 */
export function ReorderModal({
  isOpen,
  onClose,
  characters,
  onReorder,
}: ReorderModalProps) {
  // Local copy of characters for reordering
  const [localCharacters, setLocalCharacters] = useState<Character[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Reset local characters when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalCharacters([...characters]);
    }
  }, [isOpen, characters]);

  // Generate stable IDs for each character
  const characterIds = useMemo(
    () => localCharacters.map((_, index) => `char-${index}`),
    [localCharacters]
  );

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get the active character for the drag overlay
  const activeCharacter = useMemo(() => {
    if (!activeId) return null;
    const index = parseInt(activeId.replace("char-", ""), 10);
    return localCharacters[index] || null;
  }, [activeId, localCharacters]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = parseInt((active.id as string).replace("char-", ""), 10);
      const newIndex = parseInt((over.id as string).replace("char-", ""), 10);

      setLocalCharacters((chars) => arrayMove(chars, oldIndex, newIndex));
    }
  }, []);

  const handleApply = useCallback(() => {
    onReorder(localCharacters);
    onClose();
  }, [localCharacters, onReorder, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Check if order has changed
  const hasChanges = useMemo(() => {
    if (localCharacters.length !== characters.length) return true;
    return localCharacters.some((char, index) => char !== characters[index]);
  }, [localCharacters, characters]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-retro-grid/30">
          <h2 className="text-lg font-medium text-white">Reorder Characters</h2>
          <p className="text-xs text-gray-500 mt-1">
            Drag and drop characters to reorder them
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={characterIds} strategy={rectSortingStrategy}>
              <div
                className="grid gap-2 bg-black/30 rounded-lg p-3"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))" }}
              >
                {localCharacters.map((char, index) => (
                  <SortableCharacter
                    key={characterIds[index]}
                    id={characterIds[index]}
                    character={char}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeCharacter && (
                <DragOverlayCharacter character={activeCharacter} />
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-retro-grid/30 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!hasChanges}
            className="px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
