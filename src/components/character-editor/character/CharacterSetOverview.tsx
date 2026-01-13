/**
 * Character Set Overview Component
 *
 * A canvas-based compact overview of all characters in a set.
 * Used as a navigation aid and for quick character selection.
 * Features:
 * - Single canvas rendering for performance
 * - Click to select characters
 * - Long press for selection mode on touch devices
 * - Batch selection highlight
 * - Collapsible panel support
 * - Auto-scrolls to keep selected character visible
 *
 * @module components/character-editor/character/CharacterSetOverview
 */
"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";

/** Long press detection threshold in milliseconds */
const LONG_PRESS_THRESHOLD = 500;
/** Movement threshold to cancel long press in pixels */
const MOVE_THRESHOLD = 10;

export interface CharacterSetOverviewProps {
  /** Array of characters to display */
  characters: Character[];
  /** Character set configuration */
  config: CharacterSetConfig;
  /** Currently selected character index */
  selectedIndex: number;
  /** Batch selected character indices */
  batchSelection?: Set<number>;
  /** Callback when a character is clicked */
  onSelect?: (index: number) => void;
  /** Foreground color for pixels */
  foregroundColor?: string;
  /** Background color for pixels */
  backgroundColor?: string;
  /** Selection highlight color */
  selectionColor?: string;
  /** Batch selection highlight color */
  batchSelectionColor?: string;
  /** Maximum width of the overview */
  maxWidth?: number;
  /** Scale factor for each pixel (1-3) */
  pixelScale?: number;
  /** Gap between characters in pixels */
  gap?: number;
  /** Whether the overview is collapsible */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether selection mode is active */
  isSelectionMode?: boolean;
  /** Callback when long press is detected */
  onLongPress?: (index: number) => void;
  /** Callback when item is toggled in selection mode */
  onToggleSelection?: (index: number) => void;
}

/**
 * Canvas-based overview of all characters in a character set
 * Optimized for performance with large character sets
 */
export function CharacterSetOverview({
  characters,
  config,
  selectedIndex,
  batchSelection,
  onSelect,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  selectionColor = "#00ffff",
  batchSelectionColor = "#ff69b4",
  maxWidth = 200,
  pixelScale = 1,
  gap = 1,
  collapsible = true,
  defaultCollapsed = false,
  className = "",
  isSelectionMode = false,
  onLongPress,
  onToggleSelection,
}: CharacterSetOverviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Long press tracking refs
  const touchStartRef = useRef<{ x: number; y: number; time: number; index: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  // Drag-select tracking refs
  const dragSelectRef = useRef<{
    isActive: boolean;
    hasMoved: boolean;
    touchedIndices: Set<number>;
  }>({
    isActive: false,
    hasMoved: false,
    touchedIndices: new Set(),
  });
  const DRAG_THRESHOLD = 5;

  // Calculate layout
  const charWidth = config.width * pixelScale;
  const charHeight = config.height * pixelScale;
  const cellWidth = charWidth + gap;
  const cellHeight = charHeight + gap;

  // Calculate columns based on maxWidth
  const columns = Math.max(1, Math.floor(maxWidth / cellWidth));
  const rows = Math.ceil(characters.length / columns);
  const canvasWidth = columns * cellWidth - gap;
  const canvasHeight = rows * cellHeight - gap;

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || collapsed) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw each character
    characters.forEach((char, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = col * cellWidth;
      const y = row * cellHeight;

      // Draw character background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(x, y, charWidth, charHeight);

      // Draw pixels
      ctx.fillStyle = foregroundColor;
      char.pixels.forEach((pixelRow, py) => {
        pixelRow.forEach((pixel, px) => {
          if (pixel) {
            ctx.fillRect(x + px * pixelScale, y + py * pixelScale, pixelScale, pixelScale);
          }
        });
      });

      // Draw batch selection highlight (pink border)
      if (batchSelection?.has(index) && index !== selectedIndex) {
        ctx.strokeStyle = batchSelectionColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.strokeRect(x + 0.5, y + 0.5, charWidth - 1, charHeight - 1);
        ctx.globalAlpha = 1;
      }

      // Draw primary selection highlight (cyan border)
      if (index === selectedIndex) {
        ctx.strokeStyle = selectionColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, charWidth - 2, charHeight - 2);
      } else if (index === hoveredIndex && !batchSelection?.has(index)) {
        ctx.strokeStyle = selectionColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(x + 0.5, y + 0.5, charWidth - 1, charHeight - 1);
        ctx.globalAlpha = 1;
      }

      // Draw checkmark overlay for selection mode
      const isSelected = index === selectedIndex || batchSelection?.has(index);
      if (isSelectionMode && isSelected) {
        // Draw small checkmark in top-right corner
        const checkSize = Math.max(3, Math.min(6, charWidth / 3));
        const checkX = x + charWidth - checkSize;
        const checkY = y;

        // Checkmark background
        ctx.fillStyle = selectionColor;
        ctx.beginPath();
        ctx.moveTo(checkX + checkSize, checkY);
        ctx.lineTo(checkX + checkSize, checkY + checkSize);
        ctx.lineTo(checkX, checkY + checkSize);
        ctx.closePath();
        ctx.fill();

        // Checkmark icon (simple V shape)
        ctx.strokeStyle = backgroundColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const centerX = checkX + checkSize * 0.65;
        const centerY = checkY + checkSize * 0.55;
        ctx.moveTo(centerX - checkSize * 0.25, centerY);
        ctx.lineTo(centerX, centerY + checkSize * 0.2);
        ctx.lineTo(centerX + checkSize * 0.25, centerY - checkSize * 0.2);
        ctx.stroke();
      }
    });
  }, [
    characters,
    config,
    selectedIndex,
    batchSelection,
    hoveredIndex,
    foregroundColor,
    backgroundColor,
    selectionColor,
    batchSelectionColor,
    pixelScale,
    gap,
    columns,
    canvasWidth,
    canvasHeight,
    charWidth,
    charHeight,
    cellWidth,
    cellHeight,
    collapsed,
    isSelectionMode,
  ]);

  // Handle click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onSelect) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Scale coordinates based on canvas display size vs actual size
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;

      // Calculate which character was clicked
      const col = Math.floor(scaledX / cellWidth);
      const row = Math.floor(scaledY / cellHeight);
      const index = row * columns + col;

      if (index >= 0 && index < characters.length) {
        onSelect(index);
      }
    },
    [onSelect, cellWidth, cellHeight, columns, characters.length],
  );

  // Handle mouse move for hover effect
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;

      const col = Math.floor(scaledX / cellWidth);
      const row = Math.floor(scaledY / cellHeight);
      const index = row * columns + col;

      if (index >= 0 && index < characters.length) {
        setHoveredIndex(index);
      } else {
        setHoveredIndex(null);
      }
    },
    [cellWidth, cellHeight, columns, characters.length],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  // Helper function to get character index from coordinates
  const getIndexFromCoords = useCallback(
    (clientX: number, clientY: number): number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;

      const col = Math.floor(scaledX / cellWidth);
      const row = Math.floor(scaledY / cellHeight);
      const index = row * columns + col;

      if (index >= 0 && index < characters.length) {
        return index;
      }
      return null;
    },
    [cellWidth, cellHeight, columns, characters.length],
  );

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length !== 1) {
        clearLongPressTimer();
        dragSelectRef.current = { isActive: false, hasMoved: false, touchedIndices: new Set() };
        return;
      }

      const touch = e.touches[0];
      const index = getIndexFromCoords(touch.clientX, touch.clientY);

      if (index === null) return;

      isLongPressRef.current = false;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        index,
      };

      // Initialize drag-select state (active when in selection mode)
      dragSelectRef.current = {
        isActive: isSelectionMode,
        hasMoved: false,
        touchedIndices: new Set([index]), // Track starting item
      };

      // Start long press timer
      if (onLongPress) {
        clearLongPressTimer();
        longPressTimerRef.current = setTimeout(() => {
          isLongPressRef.current = true;
          onLongPress(index);
        }, LONG_PRESS_THRESHOLD);
      }
    },
    [getIndexFromCoords, onLongPress, clearLongPressTimer, isSelectionMode],
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length !== 1 || !touchStartRef.current) {
        clearLongPressTimer();
        dragSelectRef.current = { isActive: false, hasMoved: false, touchedIndices: new Set() };
        return;
      }

      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      // Cancel long press if moved too far
      if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
        clearLongPressTimer();
      }

      // Drag-select logic (when in selection mode)
      const dragState = dragSelectRef.current;
      if (dragState.isActive && onToggleSelection) {
        // Check if we've moved enough to recognize as drag
        if (!dragState.hasMoved) {
          if (dx >= DRAG_THRESHOLD || dy >= DRAG_THRESHOLD) {
            dragState.hasMoved = true;
            // Toggle the starting item
            const startIndex = touchStartRef.current.index;
            if (startIndex !== undefined) {
              onToggleSelection(startIndex);
            }
          }
        }

        // If dragging, check current position
        if (dragState.hasMoved) {
          const currentIndex = getIndexFromCoords(touch.clientX, touch.clientY);
          if (currentIndex !== null && !dragState.touchedIndices.has(currentIndex)) {
            // New item under finger - toggle it
            dragState.touchedIndices.add(currentIndex);
            onToggleSelection(currentIndex);
          }
        }
      }
    },
    [clearLongPressTimer, getIndexFromCoords, onToggleSelection],
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      clearLongPressTimer();

      const dragState = dragSelectRef.current;
      const wasDragging = dragState.hasMoved;

      // Reset drag-select state
      dragSelectRef.current = { isActive: false, hasMoved: false, touchedIndices: new Set() };

      if (!touchStartRef.current) return;

      const startData = touchStartRef.current;
      touchStartRef.current = null;

      // If it was a long press, don't handle as tap
      if (isLongPressRef.current) {
        e.preventDefault();
        return;
      }

      // If it was a drag-select gesture, don't handle as tap (items already toggled during drag)
      if (wasDragging) {
        e.preventDefault();
        return;
      }

      // Handle as tap
      if (isSelectionMode && onToggleSelection) {
        e.preventDefault();
        onToggleSelection(startData.index);
      } else if (onSelect) {
        onSelect(startData.index);
      }
    },
    [isSelectionMode, onToggleSelection, onSelect, clearLongPressTimer],
  );

  // Handle context menu (prevent on touch devices during long press)
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLongPressRef.current) {
      e.preventDefault();
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div data-testid="character-set-overview" className={`${className}`} ref={containerRef}>
      {/* Header */}
      {collapsible && (
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-between p-2 text-sm text-gray-300 hover:text-retro-cyan transition-colors"
        >
          <span className="font-medium">Overview</span>
          <svg
            className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Canvas container */}
      {!collapsed && (
        <div className={`p-2 bg-black/30 rounded ${isSelectionMode ? "ring-1 ring-retro-cyan/30" : ""}`}>
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onContextMenu={handleContextMenu}
            className="cursor-pointer"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              imageRendering: "pixelated",
              touchAction: "manipulation",
            }}
          />
        </div>
      )}
    </div>
  );
}
