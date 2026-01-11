/**
 * Pixel Grid Component
 *
 * Canvas-based pixel rendering engine for character display.
 * Low-level component used by CharacterDisplay and EditorCanvas
 * for efficient rendering of pixel bitmaps.
 *
 * Features:
 * - Efficient canvas rendering (not DOM-based)
 * - Optional grid lines between pixels
 * - Click/drag interaction with mouse and touch
 * - Mixed pixel pattern for batch editing visualization
 * - Coordinate tracking for hover display
 *
 * @module components/character-editor/editor/PixelGrid
 */
"use client";

import { useRef, useEffect, useCallback, useState } from "react";

export interface PixelGridProps {
  /** Pixel data as 2D boolean array [row][col] */
  pixels: boolean[][];
  /** Scale factor (pixels per grid cell) */
  scale?: number;
  /** Show grid lines between pixels */
  showGrid?: boolean;
  /** Grid line color */
  gridColor?: string;
  /** Grid line thickness in pixels */
  gridThickness?: number;
  /** Foreground (on) pixel color */
  foregroundColor?: string;
  /** Background (off) pixel color */
  backgroundColor?: string;
  /** Callback when a pixel is clicked (isRightClick indicates right mouse button) */
  onPixelClick?: (row: number, col: number, isRightClick?: boolean) => void;
  /** Callback during pixel drag */
  onPixelDrag?: (row: number, col: number) => void;
  /** Callback when drag ends */
  onDragEnd?: () => void;
  /** Callback when mouse hovers over a pixel (for coordinate display) */
  onPixelHover?: (row: number, col: number) => void;
  /** Callback when mouse leaves the canvas */
  onPixelLeave?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether clicking is enabled */
  interactive?: boolean;
  /** Show checkered pattern for mixed pixels (batch editing) */
  mixedPixels?: Set<string>;
  /** Mixed pixel pattern color */
  mixedColor?: string;
  /** Pixels that differ (for diff highlighting) - Set of "row,col" keys */
  diffPixels?: Set<string>;
  /** Color for diff pixels */
  diffColor?: string;
  /** Scanlines intensity (0-100, 0 = disabled) */
  scanlinesIntensity?: number;
  /** Bloom/glow intensity (0-100, 0 = disabled) */
  bloomIntensity?: number;
}

/**
 * Canvas-based pixel grid component
 *
 * Efficiently renders character pixels with optional grid lines.
 * Supports click/drag interaction for editing.
 */
export function PixelGrid({
  pixels,
  scale = 1,
  showGrid = false,
  gridColor = "#4a4a4a",
  gridThickness = 1,
  foregroundColor = "#ffffff",
  backgroundColor = "#000000",
  onPixelClick,
  onPixelDrag,
  onDragEnd,
  onPixelHover,
  onPixelLeave,
  className = "",
  interactive = true,
  mixedPixels,
  mixedColor = "#666666",
  diffPixels,
  diffColor = "#ff3333",
  scanlinesIntensity = 0,
  bloomIntensity = 0,
}: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPixelRef = useRef<{ row: number; col: number } | null>(null);

  const height = pixels.length;
  const width = pixels[0]?.length || 0;

  // Calculate canvas dimensions
  const gridOffset = showGrid ? gridThickness : 0;
  const canvasWidth = width * scale + (showGrid ? (width + 1) * gridThickness : 0);
  const canvasHeight = height * scale + (showGrid ? (height + 1) * gridThickness : 0);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Set up bloom effect if enabled (only for character pixels)
    const hasBloom = bloomIntensity > 0;
    if (hasBloom) {
      ctx.shadowColor = foregroundColor;
      ctx.shadowBlur = (bloomIntensity / 100) * scale * 2;
    }

    // Draw pixels
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const x = showGrid
          ? col * (scale + gridThickness) + gridThickness
          : col * scale;
        const y = showGrid
          ? row * (scale + gridThickness) + gridThickness
          : row * scale;

        const pixelKey = `${row},${col}`;
        const isMixed = mixedPixels?.has(pixelKey);
        const isDiff = diffPixels?.has(pixelKey);
        const isOn = pixels[row]?.[col] || false;

        if (isMixed) {
          // Draw checkered pattern for mixed pixels (disable bloom for this)
          if (hasBloom) ctx.shadowBlur = 0;
          const halfScale = Math.floor(scale / 2);
          ctx.fillStyle = foregroundColor;
          ctx.fillRect(x, y, halfScale, halfScale);
          ctx.fillRect(x + halfScale, y + halfScale, scale - halfScale, scale - halfScale);
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(x + halfScale, y, scale - halfScale, halfScale);
          ctx.fillRect(x, y + halfScale, halfScale, scale - halfScale);
          if (hasBloom) ctx.shadowBlur = (bloomIntensity / 100) * scale * 2;
        } else if (isDiff) {
          // Highlight differing pixels in red (disable bloom for this)
          if (hasBloom) ctx.shadowBlur = 0;
          ctx.fillStyle = diffColor;
          ctx.fillRect(x, y, scale, scale);
          if (hasBloom) ctx.shadowBlur = (bloomIntensity / 100) * scale * 2;
        } else {
          // Draw base pixel
          ctx.fillStyle = isOn ? foregroundColor : backgroundColor;
          // Only apply bloom to foreground pixels
          if (hasBloom && !isOn) ctx.shadowBlur = 0;
          ctx.fillRect(x, y, scale, scale);
          if (hasBloom && !isOn) ctx.shadowBlur = (bloomIntensity / 100) * scale * 2;
        }
      }
    }

    // Reset shadow before drawing scanlines and grid
    if (hasBloom) {
      ctx.shadowBlur = 0;
    }

    // Draw scanlines overlay if enabled
    if (scanlinesIntensity > 0) {
      // Map intensity 0-100 to opacity 0-0.5
      const opacity = (scanlinesIntensity / 100) * 0.5;
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;

      if (showGrid) {
        // When grid is shown, draw scanlines per pixel cell to avoid affecting grid lines
        for (let row = 0; row < height; row++) {
          for (let col = 0; col < width; col++) {
            const x = col * (scale + gridThickness) + gridThickness;
            const y = row * (scale + gridThickness) + gridThickness;

            // Draw horizontal scanlines within this pixel cell
            for (let sy = 0; sy < scale; sy += 2) {
              ctx.fillRect(x, y + sy, scale, 1);
            }
          }
        }
      } else {
        // No grid - draw scanlines across the entire canvas (full CRT effect)
        for (let y = 0; y < canvasHeight; y += 2) {
          ctx.fillRect(0, y, canvasWidth, 1);
        }
      }
    }

    // Draw grid lines LAST (on top of everything, no bloom)
    if (showGrid) {
      ctx.fillStyle = gridColor;

      // Vertical lines
      for (let col = 0; col <= width; col++) {
        const x = col * (scale + gridThickness);
        ctx.fillRect(x, 0, gridThickness, canvasHeight);
      }

      // Horizontal lines
      for (let row = 0; row <= height; row++) {
        const y = row * (scale + gridThickness);
        ctx.fillRect(0, y, canvasWidth, gridThickness);
      }
    }
  }, [
    pixels,
    scale,
    showGrid,
    gridColor,
    gridThickness,
    foregroundColor,
    backgroundColor,
    canvasWidth,
    canvasHeight,
    width,
    height,
    mixedPixels,
    mixedColor,
    diffPixels,
    diffColor,
    scanlinesIntensity,
    bloomIntensity,
  ]);

  // Convert canvas coordinates to pixel coordinates
  const getPixelFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX: number;
      let clientY: number;

      if ("touches" in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Scale to canvas coordinates
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = x * scaleX;
      const canvasY = y * scaleY;

      // Calculate pixel position
      const cellSize = scale + (showGrid ? gridThickness : 0);
      const col = Math.floor((canvasX - gridOffset) / cellSize);
      const row = Math.floor((canvasY - gridOffset) / cellSize);

      if (row >= 0 && row < height && col >= 0 && col < width) {
        return { row, col };
      }

      return null;
    },
    [scale, showGrid, gridThickness, gridOffset, height, width]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive) return;

      // Prevent context menu for right-click
      if (e.button === 2) {
        e.preventDefault();
      }

      const pixel = getPixelFromEvent(e);
      if (pixel && onPixelClick) {
        // Pass right-click indicator (button 2 = right click)
        onPixelClick(pixel.row, pixel.col, e.button === 2);
        lastPixelRef.current = pixel;
        setIsDragging(true);
      }
    },
    [interactive, getPixelFromEvent, onPixelClick]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Prevent default context menu when interactive
      if (interactive) {
        e.preventDefault();
      }
    },
    [interactive]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive) return;

      const pixel = getPixelFromEvent(e);

      // Always track hover for coordinates display
      if (pixel && onPixelHover) {
        onPixelHover(pixel.row, pixel.col);
      }

      // Handle drag painting
      if (isDragging && onPixelDrag && pixel) {
        // Only trigger if moved to a different pixel
        if (
          !lastPixelRef.current ||
          lastPixelRef.current.row !== pixel.row ||
          lastPixelRef.current.col !== pixel.col
        ) {
          onPixelDrag(pixel.row, pixel.col);
          lastPixelRef.current = pixel;
        }
      }
    },
    [interactive, isDragging, getPixelFromEvent, onPixelDrag, onPixelHover]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      lastPixelRef.current = null;
      onDragEnd?.();
    }
  }, [isDragging, onDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      lastPixelRef.current = null;
      onDragEnd?.();
    }
    // Notify that mouse left the canvas (clear coordinates display)
    onPixelLeave?.();
  }, [isDragging, onDragEnd, onPixelLeave]);

  // Touch handlers - use refs for callbacks to avoid re-registering listeners
  const interactiveRef = useRef(interactive);
  const onPixelClickRef = useRef(onPixelClick);
  const onPixelDragRef = useRef(onPixelDrag);
  const onDragEndRef = useRef(onDragEnd);
  const isDraggingRef = useRef(isDragging);

  // Keep refs in sync
  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);
  useEffect(() => {
    onPixelClickRef.current = onPixelClick;
  }, [onPixelClick]);
  useEffect(() => {
    onPixelDragRef.current = onPixelDrag;
  }, [onPixelDrag]);
  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Native touch event handlers with { passive: false } to allow preventDefault
  // React's synthetic events are passive by default, causing the error on iPad
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPixelFromTouchEvent = (e: TouchEvent) => {
      if (e.touches.length === 0) return null;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = x * scaleX;
      const canvasY = y * scaleY;

      const cellSize = scale + (showGrid ? gridThickness : 0);
      const col = Math.floor((canvasX - gridOffset) / cellSize);
      const row = Math.floor((canvasY - gridOffset) / cellSize);

      if (row >= 0 && row < height && col >= 0 && col < width) {
        return { row, col };
      }
      return null;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!interactiveRef.current) return;
      e.preventDefault();

      const pixel = getPixelFromTouchEvent(e);
      if (pixel && onPixelClickRef.current) {
        onPixelClickRef.current(pixel.row, pixel.col);
        lastPixelRef.current = pixel;
        setIsDragging(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!interactiveRef.current || !isDraggingRef.current || !onPixelDragRef.current) return;
      e.preventDefault();

      const pixel = getPixelFromTouchEvent(e);
      if (pixel) {
        if (
          !lastPixelRef.current ||
          lastPixelRef.current.row !== pixel.row ||
          lastPixelRef.current.col !== pixel.col
        ) {
          onPixelDragRef.current(pixel.row, pixel.col);
          lastPixelRef.current = pixel;
        }
      }
    };

    const handleTouchEnd = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        lastPixelRef.current = null;
        onDragEndRef.current?.();
      }
    };

    // Add listeners with { passive: false } to allow preventDefault
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scale, showGrid, gridThickness, gridOffset, height, width]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className={`${interactive ? "cursor-crosshair" : ""} ${className}`}
      style={{
        imageRendering: "pixelated",
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
    />
  );
}
