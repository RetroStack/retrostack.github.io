/**
 * Editor Canvas Component
 *
 * Main editing surface for character pixels. The central component where
 * users draw/edit individual character bitmaps.
 *
 * Features:
 * - Click/drag painting with left mouse (toggle/set on)
 * - Right-click drag painting (set off/erase)
 * - Ctrl/Cmd+scroll wheel for zooming
 * - Pinch-to-zoom on touch devices
 * - Batch editing mode with mixed-pixel visualization
 * - Overlay layer for tracing from another character set
 *
 * @module components/character-editor/editor/EditorCanvas
 */
"use client";

import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { CharacterDisplay } from "../character/CharacterDisplay";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";

export interface EditorCanvasProps {
  /** Character being edited */
  character: Character | null;
  /** Character set configuration */
  config: CharacterSetConfig;
  /** Callback when a pixel is toggled */
  onPixelToggle?: (row: number, col: number) => void;
  /** Callback when a pixel is set (during drag) */
  onPixelSet?: (row: number, col: number, value: boolean) => void;
  /** Callback when drag starts */
  onDragStart?: () => void;
  /** Callback when drag ends */
  onDragEnd?: () => void;
  /** Get pixel state for batch editing */
  getPixelState?: (row: number, col: number) => "same-on" | "same-off" | "mixed";
  /** Whether batch editing mode is active */
  batchMode?: boolean;
  /** Foreground color */
  foregroundColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Grid line color */
  gridColor?: string;
  /** Grid line thickness */
  gridThickness?: number;
  /** Zoom level (scale factor) */
  zoom?: number;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Callback when zoom changes (for scroll wheel zoom) */
  onZoomChange?: (zoom: number) => void;
  /** Callback when hovering over a pixel (returns coordinates) */
  onPixelHover?: (row: number, col: number) => void;
  /** Callback when mouse leaves the canvas */
  onPixelLeave?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Overlay character for tracing (optional) */
  overlayCharacter?: Character | null;
  /** Configuration of the overlay character set */
  overlayConfig?: CharacterSetConfig;
  /** Overlay rendering mode */
  overlayMode?: "stretch" | "pixel" | "side-by-side";
  /** Whether keyboard cursor mode is enabled (for accessibility) */
  keyboardCursorEnabled?: boolean;
}

/**
 * Main editing canvas for character pixels
 * Simplified version - header/footer moved to EditorHeader/EditorFooter
 */
export function EditorCanvas({
  character,
  config,
  onPixelToggle,
  onPixelSet,
  onDragStart,
  onDragEnd,
  getPixelState,
  batchMode = false,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  gridColor = "#4a4a4a",
  gridThickness = 1,
  zoom = 20,
  minZoom = 8,
  maxZoom = 40,
  onZoomChange,
  onPixelHover,
  onPixelLeave,
  className = "",
  overlayCharacter,
  overlayConfig,
  overlayMode = "pixel",
  keyboardCursorEnabled = true,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);

  // Keyboard cursor position for accessibility
  const [cursorPos, setCursorPos] = useState<{ row: number; col: number } | null>(null);
  const [isCursorActive, setIsCursorActive] = useState(false);

  // Calculate mixed pixels for batch editing display
  const mixedPixels = useMemo(() => {
    if (!batchMode || !getPixelState || !character) return undefined;

    const mixed = new Set<string>();
    for (let row = 0; row < config.height; row++) {
      for (let col = 0; col < config.width; col++) {
        if (getPixelState(row, col) === "mixed") {
          mixed.add(`${row},${col}`);
        }
      }
    }
    return mixed.size > 0 ? mixed : undefined;
  }, [batchMode, getPixelState, character, config.height, config.width]);

  // Calculate overlay canvas dimensions and render
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !overlayConfig) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate main canvas dimensions (matching PixelGrid calculations)
    const mainWidth = config.width;
    const mainHeight = config.height;
    const overlayWidth = overlayConfig.width;
    const overlayHeight = overlayConfig.height;

    // Canvas dimensions should match the main character display (with grid)
    const cellSize = zoom + gridThickness;
    const canvasWidth = mainWidth * cellSize + gridThickness;
    const canvasHeight = mainHeight * cellSize + gridThickness;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // If no overlay character at current index, nothing to draw
    if (!overlayCharacter) return;

    // Semi-transparent pink for overlay pixels
    const overlayColor = "rgba(255, 0, 128, 0.5)";
    ctx.fillStyle = overlayColor;

    if (overlayMode === "stretch") {
      // Stretch mode: shrink overlay to fit within current character's canvas area
      // Each overlay pixel is drawn at a smaller size to fit all pixels
      const availableWidth = mainWidth * cellSize;
      const availableHeight = mainHeight * cellSize;

      // Calculate pixel size to fit overlay within available space
      const pixelWidth = availableWidth / overlayWidth;
      const pixelHeight = availableHeight / overlayHeight;

      for (let row = 0; row < overlayHeight; row++) {
        for (let col = 0; col < overlayWidth; col++) {
          const isOn = overlayCharacter.pixels[row]?.[col] || false;
          if (isOn) {
            const x = gridThickness + col * pixelWidth;
            const y = gridThickness + row * pixelHeight;
            ctx.fillRect(x, y, pixelWidth, pixelHeight);
          }
        }
      }
    } else {
      // Pixel-by-pixel mode: draw at same scale, clip to visible area
      const maxRows = Math.min(overlayHeight, mainHeight);
      const maxCols = Math.min(overlayWidth, mainWidth);

      for (let row = 0; row < maxRows; row++) {
        for (let col = 0; col < maxCols; col++) {
          const isOn = overlayCharacter.pixels[row]?.[col] || false;
          if (isOn) {
            const x = col * cellSize + gridThickness;
            const y = row * cellSize + gridThickness;
            ctx.fillRect(x, y, zoom, zoom);
          }
        }
      }
    }
  }, [overlayCharacter, overlayConfig, overlayMode, config.width, config.height, zoom, gridThickness]);

  const handlePixelClick = useCallback(
    (row: number, col: number, isRightClick?: boolean) => {
      if (!isDragging) {
        // Start batch mode before any pixel changes
        onDragStart?.();
        if (isRightClick) {
          // Right-click: paint background (turn pixel off)
          onPixelSet?.(row, col, false);
          setDragValue(false);
        } else {
          // Left-click: toggle pixel
          onPixelToggle?.(row, col);
          // Set drag value based on the new state (opposite of current)
          const currentValue = character?.pixels[row]?.[col] ?? false;
          setDragValue(!currentValue);
        }
        setIsDragging(true);
      }
    },
    [isDragging, onPixelToggle, onPixelSet, onDragStart, character],
  );

  const handlePixelDrag = useCallback(
    (row: number, col: number) => {
      if (isDragging && dragValue !== null && onPixelSet) {
        onPixelSet(row, col, dragValue);
      }
    },
    [isDragging, dragValue, onPixelSet],
  );

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragValue(null);
      onDragEnd?.();
    }
  }, [isDragging, onDragEnd]);

  // Handle scroll wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      // Only zoom if Ctrl/Cmd is held
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (onZoomChange) {
          const delta = e.deltaY > 0 ? -4 : 4;
          const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom + delta));
          if (newZoom !== zoom) {
            onZoomChange(newZoom);
          }
        }
      }
    },
    [zoom, minZoom, maxZoom, onZoomChange],
  );

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Handle pinch-to-zoom touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        // Two-finger touch - start pinch zoom
        e.preventDefault();
        lastPinchDistanceRef.current = getTouchDistance(e.touches);
      }
    },
    [getTouchDistance],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && lastPinchDistanceRef.current !== null && onZoomChange) {
        // Two-finger move - pinch zoom
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        if (currentDistance !== null) {
          const delta = (currentDistance - lastPinchDistanceRef.current) / 20;
          const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom + delta));
          if (Math.abs(newZoom - zoom) >= 1) {
            onZoomChange(Math.round(newZoom));
            lastPinchDistanceRef.current = currentDistance;
          }
        }
      }
    },
    [getTouchDistance, zoom, minZoom, maxZoom, onZoomChange],
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchDistanceRef.current = null;
  }, []);

  // Keyboard navigation for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!keyboardCursorEnabled || !character) return;

      const navigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"];
      const actionKeys = [" ", "Enter"];

      if (navigationKeys.includes(e.key) || actionKeys.includes(e.key)) {
        e.preventDefault();

        // Activate cursor if not active
        if (!isCursorActive) {
          setIsCursorActive(true);
          setCursorPos({ row: 0, col: 0 });
          return;
        }

        const currentRow = cursorPos?.row ?? 0;
        const currentCol = cursorPos?.col ?? 0;

        if (actionKeys.includes(e.key)) {
          // Toggle pixel at cursor position
          onPixelToggle?.(currentRow, currentCol);
        } else {
          // Navigation
          let newRow = currentRow;
          let newCol = currentCol;

          switch (e.key) {
            case "ArrowUp":
              newRow = Math.max(0, currentRow - 1);
              break;
            case "ArrowDown":
              newRow = Math.min(config.height - 1, currentRow + 1);
              break;
            case "ArrowLeft":
              newCol = Math.max(0, currentCol - 1);
              break;
            case "ArrowRight":
              newCol = Math.min(config.width - 1, currentCol + 1);
              break;
            case "Home":
              newRow = 0;
              newCol = 0;
              break;
            case "End":
              newRow = config.height - 1;
              newCol = config.width - 1;
              break;
          }

          setCursorPos({ row: newRow, col: newCol });
          // Update hover display with cursor position
          onPixelHover?.(newRow, newCol);
        }
      }
    },
    [keyboardCursorEnabled, character, isCursorActive, cursorPos, config.height, config.width, onPixelToggle, onPixelHover]
  );

  // Handle focus/blur to show/hide cursor
  const handleFocus = useCallback(() => {
    if (keyboardCursorEnabled && character) {
      setIsCursorActive(true);
      if (!cursorPos) {
        setCursorPos({ row: 0, col: 0 });
      }
    }
  }, [keyboardCursorEnabled, character, cursorPos]);

  const handleBlur = useCallback(() => {
    setIsCursorActive(false);
  }, []);

  // Draw keyboard cursor overlay
  useEffect(() => {
    const canvas = cursorCanvasRef.current;
    if (!canvas || !isCursorActive || !cursorPos) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate canvas dimensions
    const cellSize = zoom + gridThickness;
    const canvasWidth = config.width * cellSize + gridThickness;
    const canvasHeight = config.height * cellSize + gridThickness;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw cursor highlight
    const x = cursorPos.col * cellSize + gridThickness;
    const y = cursorPos.row * cellSize + gridThickness;

    // Draw animated border
    ctx.strokeStyle = "#00f5ff"; // retro-cyan
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(x - 1, y - 1, zoom + 2, zoom + 2);

    // Draw corner markers for better visibility
    ctx.fillStyle = "#00f5ff";
    const markerSize = 4;
    // Top-left
    ctx.fillRect(x - 1, y - 1, markerSize, 2);
    ctx.fillRect(x - 1, y - 1, 2, markerSize);
    // Top-right
    ctx.fillRect(x + zoom - markerSize + 1, y - 1, markerSize, 2);
    ctx.fillRect(x + zoom - 1, y - 1, 2, markerSize);
    // Bottom-left
    ctx.fillRect(x - 1, y + zoom - 1, markerSize, 2);
    ctx.fillRect(x - 1, y + zoom - markerSize + 1, 2, markerSize);
    // Bottom-right
    ctx.fillRect(x + zoom - markerSize + 1, y + zoom - 1, markerSize, 2);
    ctx.fillRect(x + zoom - 1, y + zoom - markerSize + 1, 2, markerSize);
  }, [isCursorActive, cursorPos, zoom, gridThickness, config.width, config.height]);

  // Set up passive: false for touch events to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options = { passive: false };

    const touchMoveHandler = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
      }
    };

    container.addEventListener("touchmove", touchMoveHandler, options);
    return () => {
      container.removeEventListener("touchmove", touchMoveHandler);
    };
  }, []);

  if (!character) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
            />
          </svg>
          <p>No character selected</p>
        </div>
      </div>
    );
  }

  // Calculate canvas dimensions for cursor overlay
  const cellSize = zoom + gridThickness;
  const cursorCanvasWidth = config.width * cellSize + gridThickness;
  const cursorCanvasHeight = config.height * cellSize + gridThickness;

  // ARIA label for current cursor position
  const cursorAriaLabel = cursorPos && isCursorActive
    ? `Pixel at row ${cursorPos.row + 1}, column ${cursorPos.col + 1}, ${character?.pixels[cursorPos.row]?.[cursorPos.col] ? "on" : "off"}`
    : "Pixel editor canvas";

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center w-full h-full overflow-hidden ${className} ${isCursorActive ? "ring-2 ring-retro-cyan/50 rounded" : ""}`}
      tabIndex={0}
      role="application"
      aria-label={cursorAriaLabel}
      aria-roledescription="Pixel editor"
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="inline-block" onMouseLeave={handleDragEnd} onMouseUp={handleDragEnd}>
        <div className="relative">
          <CharacterDisplay
            character={character}
            mode="large"
            scale={zoom}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            gridColor={gridColor}
            gridThickness={gridThickness}
            onPixelClick={handlePixelClick}
            onPixelDrag={handlePixelDrag}
            onDragEnd={handleDragEnd}
            onPixelHover={onPixelHover}
            onPixelLeave={onPixelLeave}
            interactive={true}
            mixedPixels={mixedPixels}
          />
          {/* Keyboard cursor overlay */}
          {isCursorActive && cursorPos && (
            <canvas
              ref={cursorCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                imageRendering: "pixelated",
                zIndex: 15,
                width: cursorCanvasWidth,
                height: cursorCanvasHeight,
              }}
              aria-hidden="true"
            />
          )}
          {/* Overlay canvas for tracing another character set (not shown in side-by-side mode) */}
          {overlayConfig &&
            overlayMode !== "side-by-side" &&
            (() => {
              const w = config.width * cellSize + gridThickness;
              const h = config.height * cellSize + gridThickness;
              return (
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    imageRendering: "pixelated",
                    zIndex: 10,
                    width: w,
                    height: h,
                  }}
                />
              );
            })()}
        </div>
      </div>
    </div>
  );
}
