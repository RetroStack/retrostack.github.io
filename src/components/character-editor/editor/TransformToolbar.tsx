/**
 * Transform Toolbar Component
 *
 * Vertical toolbar with character transformation tools.
 * Provides before/after preview in tooltips.
 * Actions grouped by category:
 * - Rotate: Left/right 90°
 * - Flip: Horizontal/vertical mirror
 * - Shift: Move pixels in any direction
 * - Fill operations: Clear, fill, invert, center
 * - Clipboard: Copy, paste, delete
 *
 * Uses ResponsiveToolbar internally for adaptive layout.
 *
 * @module components/character-editor/editor/TransformToolbar
 */
"use client";

import { useCallback, useMemo } from "react";
import { Character } from "@/lib/character-editor/types";
import {
  rotateCharacter,
  shiftCharacter,
  flipHorizontal,
  flipVertical,
  invertCharacter,
  clearCharacter,
  fillCharacter,
  centerCharacter,
} from "@/lib/character-editor/transforms";

// Icons from centralized library
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons/ArrowIcons";
import {
  RotateLeftIcon,
  RotateRightIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  ScaleIcon,
  CenterIcon,
} from "@/components/ui/icons/TransformIcons";
import { AddIcon, DuplicateIcon, DeleteIcon, ClearIcon, FillIcon, InvertIcon } from "@/components/ui/icons/ActionIcons";

// Extracted components
import { TransformPreviewContent } from "./TransformPreview";
import { ToolbarButton, ToolbarDivider, ToolbarLabel } from "./ToolbarPrimitives";

export interface TransformToolbarProps {
  /** Current character being edited (for preview) */
  character?: Character | null;
  /** Character dimensions (for clear/fill) */
  characterWidth?: number;
  /** Character dimensions (for clear/fill) */
  characterHeight?: number;
  /** Callback for shift operations */
  onShift: (direction: "up" | "down" | "left" | "right") => void;
  /** Callback for rotate operations */
  onRotate: (direction: "left" | "right") => void;
  /** Callback for flip horizontal */
  onFlipHorizontal: () => void;
  /** Callback for flip vertical */
  onFlipVertical: () => void;
  /** Callback for invert */
  onInvert: () => void;
  /** Callback for clear */
  onClear: () => void;
  /** Callback for fill */
  onFill: () => void;
  /** Callback for center content */
  onCenter: () => void;
  /** Callback for scale */
  onScale: () => void;
  /** Callback for delete */
  onDelete: () => void;
  /** Callback for copy from current set */
  onCopy: () => void;
  /** Callback for adding a new character */
  onAdd: () => void;
  /** Callback for duplicating selected characters */
  onDuplicate: () => void;
  /** Callback for importing characters */
  onImport: () => void;
  /** Whether toolbar is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Right-side toolbar for character transform operations
 * Features a cross layout for shift buttons and grouped transform operations
 */
export function TransformToolbar({
  character,
  characterWidth = 8,
  characterHeight = 8,
  onShift,
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
  onInvert,
  onClear,
  onFill,
  onCenter,
  onScale,
  onDelete,
  onCopy,
  onAdd,
  onDuplicate,
  onImport,
  disabled = false,
  className = "",
}: TransformToolbarProps) {
  const handleShiftUp = useCallback(() => onShift("up"), [onShift]);
  const handleShiftDown = useCallback(() => onShift("down"), [onShift]);
  const handleShiftLeft = useCallback(() => onShift("left"), [onShift]);
  const handleShiftRight = useCallback(() => onShift("right"), [onShift]);
  const handleRotateLeft = useCallback(() => onRotate("left"), [onRotate]);
  const handleRotateRight = useCallback(() => onRotate("right"), [onRotate]);

  // Generate preview content for transform buttons
  const previews = useMemo(() => {
    if (!character) return null;

    const before = character.pixels;

    return {
      shiftUp: (
        <TransformPreviewContent
          before={before}
          after={shiftCharacter(character, "up").pixels}
          label="Shift Up"
          shortcut="W"
        />
      ),
      shiftDown: (
        <TransformPreviewContent
          before={before}
          after={shiftCharacter(character, "down").pixels}
          label="Shift Down"
          shortcut="S"
        />
      ),
      shiftLeft: (
        <TransformPreviewContent
          before={before}
          after={shiftCharacter(character, "left").pixels}
          label="Shift Left"
          shortcut="A"
        />
      ),
      shiftRight: (
        <TransformPreviewContent
          before={before}
          after={shiftCharacter(character, "right").pixels}
          label="Shift Right"
          shortcut="D"
        />
      ),
      rotateLeft: (
        <TransformPreviewContent
          before={before}
          after={rotateCharacter(character, "left").pixels}
          label="Rotate Left"
          shortcut="Shift+R"
        />
      ),
      rotateRight: (
        <TransformPreviewContent
          before={before}
          after={rotateCharacter(character, "right").pixels}
          label="Rotate Right"
          shortcut="R"
        />
      ),
      flipHorizontal: (
        <TransformPreviewContent
          before={before}
          after={flipHorizontal(character).pixels}
          label="Flip Horizontal"
          shortcut="H"
        />
      ),
      flipVertical: (
        <TransformPreviewContent
          before={before}
          after={flipVertical(character).pixels}
          label="Flip Vertical"
          shortcut="V"
        />
      ),
      invert: (
        <TransformPreviewContent
          before={before}
          after={invertCharacter(character).pixels}
          label="Invert Colors"
          shortcut="I"
        />
      ),
      center: (
        <TransformPreviewContent before={before} after={centerCharacter(character).pixels} label="Center Content" />
      ),
      clear: (
        <TransformPreviewContent
          before={before}
          after={clearCharacter(characterWidth, characterHeight).pixels}
          label="Clear"
        />
      ),
      fill: (
        <TransformPreviewContent
          before={before}
          after={fillCharacter(characterWidth, characterHeight).pixels}
          label="Fill"
        />
      ),
    };
  }, [character, characterWidth, characterHeight]);

  return (
    <div
      className={`
        flex flex-col items-center py-1 px-2 bg-retro-navy/50 border-l border-retro-grid/30 overflow-hidden
        ${className}
      `}
    >
      {/* Shift section with cross layout */}
      <ToolbarLabel>Shift</ToolbarLabel>
      <div className="flex flex-col items-center gap-0.5">
        {/* Up button */}
        <ToolbarButton
          onClick={handleShiftUp}
          disabled={disabled}
          tooltip="Shift Up"
          shortcut="W"
          previewContent={previews?.shiftUp}
        >
          <ArrowUpIcon />
        </ToolbarButton>

        {/* Left - Center - Right row */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={handleShiftLeft}
            disabled={disabled}
            tooltip="Shift Left"
            shortcut="A"
            previewContent={previews?.shiftLeft}
          >
            <ArrowLeftIcon />
          </ToolbarButton>

          {/* Center button */}
          <ToolbarButton
            onClick={() => onCenter?.()}
            disabled={disabled || !onCenter}
            tooltip="Center Content"
            previewContent={previews?.center}
          >
            <CenterIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={handleShiftRight}
            disabled={disabled}
            tooltip="Shift Right"
            shortcut="D"
            previewContent={previews?.shiftRight}
          >
            <ArrowRightIcon />
          </ToolbarButton>
        </div>

        {/* Down button */}
        <ToolbarButton
          onClick={handleShiftDown}
          disabled={disabled}
          tooltip="Shift Down"
          shortcut="S"
          previewContent={previews?.shiftDown}
        >
          <ArrowDownIcon />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* Rotate section */}
      <ToolbarLabel>Rotate</ToolbarLabel>
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={handleRotateLeft}
          disabled={disabled}
          tooltip="Rotate Left"
          shortcut="Shift+R"
          previewContent={previews?.rotateLeft}
        >
          <RotateLeftIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleRotateRight}
          disabled={disabled}
          tooltip="Rotate Right"
          shortcut="R"
          previewContent={previews?.rotateRight}
        >
          <RotateRightIcon />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* Flip section */}
      <ToolbarLabel>Flip</ToolbarLabel>
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={onFlipHorizontal}
          disabled={disabled}
          tooltip="Flip Horizontal"
          shortcut="H"
          previewContent={previews?.flipHorizontal}
        >
          <FlipHorizontalIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={onFlipVertical}
          disabled={disabled}
          tooltip="Flip Vertical"
          shortcut="V"
          previewContent={previews?.flipVertical}
        >
          <FlipVerticalIcon />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* Modify section */}
      <ToolbarLabel>Modify</ToolbarLabel>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={onInvert}
            disabled={disabled}
            tooltip="Invert Colors"
            shortcut="I"
            previewContent={previews?.invert}
          >
            <InvertIcon />
          </ToolbarButton>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={onClear} disabled={disabled} tooltip="Clear" previewContent={previews?.clear}>
            <ClearIcon />
          </ToolbarButton>
          <ToolbarButton onClick={onFill} disabled={disabled} tooltip="Fill" previewContent={previews?.fill}>
            <FillIcon />
          </ToolbarButton>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={onScale} disabled={disabled} tooltip="Scale Character">
            <ScaleIcon />
          </ToolbarButton>
          <ToolbarButton onClick={onCopy} disabled={disabled} tooltip="Copy from character set" shortcut="C">
            {/* Custom icon: grid with arrow pointing to character */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {/* Small grid representing source character set */}
              <rect x="3" y="3" width="4" height="4" strokeWidth={1.5} />
              <rect x="8" y="3" width="4" height="4" strokeWidth={1.5} />
              <rect x="3" y="8" width="4" height="4" strokeWidth={1.5} />
              <rect x="8" y="8" width="4" height="4" strokeWidth={1.5} />
              {/* Arrow pointing to target */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10h6m0 0l-3-3m3 3l-3 3" />
              {/* Target character */}
              <rect x="15" y="15" width="6" height="6" rx="1" strokeWidth={2} />
            </svg>
          </ToolbarButton>
        </div>
      </div>

      {/* Character section */}
      <ToolbarDivider />
      <ToolbarLabel>Char</ToolbarLabel>
      <div className="flex flex-col  items-center gap-1">
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={onAdd} disabled={disabled} tooltip="Add new character" shortcut="Ctrl+N">
            <AddIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={onDuplicate}
            disabled={disabled}
            tooltip="Duplicate selected characters"
            shortcut="Ctrl+D"
          >
            <DuplicateIcon />
          </ToolbarButton>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={onImport}
            disabled={disabled}
            tooltip="Import characters from another set"
            shortcut="Ctrl+I"
          >
            {/* Letter A with arrow pointing down */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 20l2.5-7h3L16 20M9.25 16h5.5"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v8m0 0l-3-3m3 3l3-3" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={onDelete}
            disabled={disabled}
            tooltip="Delete character"
            shortcut="Del"
            className="hover:text-red-400"
          >
            <DeleteIcon />
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
}
