"use client";

import { ColorPresetSelector } from "./ColorPresetSelector";
import { CustomColors } from "@/lib/character-editor/colorPresets";
import { getCharacterDisplayName, isPrintableAscii } from "@/lib/character-editor/ascii";
import { Tooltip } from "@/components/ui/Tooltip";

export interface EditorHeaderProps {
  /** Character set name */
  characterSetName: string;
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
  isDirty,
  characterIndex,
  totalCharacters,
  batchMode = false,
  zoom,
  minZoom = 8,
  maxZoom = 40,
  zoomStep = 4,
  onZoomChange,
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
  const controlCharName = getCharacterDisplayName(characterIndex);

  return (
    <div className={`flex items-center gap-4 px-4 py-2 bg-retro-navy/50 border-b border-retro-grid/50 ${className}`}>
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

      {/* Character set name with dirty indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
        <span className="truncate max-w-[150px] sm:max-w-[200px]" title={characterSetName}>
          {characterSetName}
        </span>
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
        {controlCharName && (
          <span
            className="px-1.5 py-0.5 text-xs bg-retro-pink/20 text-retro-pink rounded"
            title="ASCII Control Character"
          >
            {" "}
            ({controlCharName})
          </span>
        )}
        {batchMode && <span className="px-1.5 py-0.5 text-xs bg-retro-pink/20 text-retro-pink rounded">Batch</span>}
      </div>

      {/* Flexible spacer */}
      <div className="flex-1" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
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
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-retro-grid/50" />

      {/* Color preset selector */}
      <ColorPresetSelector colors={colors} onColorsChange={onColorsChange} />
    </div>
  );
}
