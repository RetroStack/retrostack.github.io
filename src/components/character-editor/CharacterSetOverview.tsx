"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";

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
}: CharacterSetOverviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
            ctx.fillRect(
              x + px * pixelScale,
              y + py * pixelScale,
              pixelScale,
              pixelScale
            );
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
    [onSelect, cellWidth, cellHeight, columns, characters.length]
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
    [cellWidth, cellHeight, columns, characters.length]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div className={`${className}`} ref={containerRef}>
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      {/* Canvas container */}
      {!collapsed && (
        <div
          className="p-2 bg-black/30 rounded overflow-auto"
          style={{ maxHeight: "150px" }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="cursor-pointer"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              imageRendering: "pixelated",
            }}
          />
        </div>
      )}
    </div>
  );
}
