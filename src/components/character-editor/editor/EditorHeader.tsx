/**
 * Editor Header Component
 *
 * Consolidated header bar for the character editor containing:
 * - Back button to return to library
 * - Character set name with dirty indicator
 * - Current character info (index, ASCII value, control char name)
 * - Zoom controls with slider
 * - Color preset selector for foreground/background colors
 *
 * @module components/character-editor/editor/EditorHeader
 */
"use client";

import { ColorPresetSelector } from "../selectors/ColorPresetSelector";
import { CustomColors } from "@/lib/character-editor/data/colorPresets";
import { getControlCharInfo, isPrintableAscii } from "@/lib/character-editor/data/ascii";
import { Tooltip } from "@/components/ui/Tooltip";

export interface EditorHeaderProps {
  /** Character set name */
  characterSetName: string;
  /** Whether this is a built-in (read-only) character set */
  isBuiltIn?: boolean;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Current character index (0-based) */
  characterIndex: number;
  /** Total number of characters */
  totalCharacters: number;
  /** Whether batch mode is active */
  batchMode?: boolean;
  /** Current zoom level */
  zoom: number;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Zoom step */
  zoomStep?: number;
  /** Callback when zoom changes */
  onZoomChange: (zoom: number) => void;
  /** Callback when zoom to fit is requested */
  onZoomToFit: () => void;
  /** Current colors */
  colors: CustomColors;
  /** Callback when colors change */
  onColorsChange: (colors: CustomColors) => void;
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Consolidated header bar for the character editor
 * Contains: back button, set name, character info, zoom, and color controls
 */
export function EditorHeader({
  characterSetName,
  isBuiltIn = false,
  isDirty,
  characterIndex,
  totalCharacters,
  batchMode = false,
  zoom,
  minZoom = 8,
  maxZoom = 40,
  zoomStep = 4,
  onZoomChange,
  onZoomToFit,
  colors,
  onColorsChange,
  onBack,
  className = "",
}: EditorHeaderProps) {
  const handleZoomIn = () => {
    if (zoom < maxZoom) {
      onZoomChange(Math.min(zoom + zoomStep, maxZoom));
    }
  };

  const handleZoomOut = () => {
    if (zoom > minZoom) {
      onZoomChange(Math.max(zoom - zoomStep, minZoom));
    }
  };

  // Check if character is printable ASCII (32-126) or control character
  const isPrintable = isPrintableAscii(characterIndex);
  const controlCharInfo = getControlCharInfo(characterIndex);

  return (
    <div data-testid="editor-header" className={`flex items-center gap-4 px-4 py-2 bg-retro-navy/50 border-b border-retro-grid/50 ${className}`}>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-retro-cyan transition-colors whitespace-nowrap"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-retro-grid/50" />

      {/* Character set name with read-only/dirty indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
        <span className="truncate max-w-[150px] sm:max-w-[200px]" title={characterSetName}>
          {characterSetName}
        </span>
        {isBuiltIn && (
          <span
            className="flex-shrink-0 text-xs px-2 py-0.5 rounded bg-retro-amber/20 text-retro-amber border border-retro-amber/30"
            title="Built-in character sets are read-only. Use 'Save As' to create an editable copy."
          >
            Read-only
          </span>
        )}
        {isDirty && (
          <span className="flex items-center gap-1.5 flex-shrink-0" title="Unsaved changes">
            {/* Pulsing dot indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-retro-pink opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-retro-pink" />
            </span>
            {/* Unsaved badge */}
            <span className="hidden sm:inline text-xs text-retro-pink font-medium">
              Unsaved
            </span>
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-retro-grid/50 hidden sm:block" />

      {/* Character info */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
        <span className="whitespace-nowrap">
          Char <span className="text-retro-cyan">{characterIndex}</span>
          <span className="text-gray-500">/{totalCharacters}</span>
        </span>
        {isPrintable && (
          <span
            className="px-1.5 py-0.5 bg-retro-purple/30 text-retro-cyan rounded text-xs font-mono"
            title="Printable ASCII Character"
          >
            &apos;{String.fromCharCode(characterIndex)}&apos;
          </span>
        )}
        {controlCharInfo && (
          <span className="px-1.5 py-0.5 text-xs bg-retro-pink/20 text-retro-pink rounded">
            {controlCharInfo.abbr} ({controlCharInfo.name})
          </span>
        )}
        {batchMode && <span className="px-1.5 py-0.5 text-xs bg-retro-pink/20 text-retro-pink rounded">Batch</span>}
      </div>

      {/* Flexible spacer */}
      <div className="flex-1" />

      {/* Zoom controls */}
      <div data-testid="zoom-controls" className="flex items-center gap-1">
        <Tooltip content="Zoom out" shortcut="-">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= minZoom}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </Tooltip>
        <span className="text-xs text-gray-500 w-10 text-center">{zoom}x</span>
        <Tooltip content="Zoom in" shortcut="+">
          <button
            onClick={handleZoomIn}
            disabled={zoom >= maxZoom}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip content="Zoom to fit" shortcut="0">
          <button
            onClick={onZoomToFit}
            className="p-1 text-gray-400 hover:text-white ml-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {/* Frame corners with inner square - fit content to view */}
              {/* Top-left corner */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4" />
              {/* Top-right corner */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4h4v4" />
              {/* Bottom-left corner */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v4h4" />
              {/* Bottom-right corner */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 16v4h-4" />
              {/* Inner content square */}
              <rect x="8" y="8" width="8" height="8" strokeWidth={2} rx="1" />
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-retro-grid/50" />

      {/* Color preset selector */}
      <ColorPresetSelector colors={colors} onColorsChange={onColorsChange} />
    </div>
  );
}
