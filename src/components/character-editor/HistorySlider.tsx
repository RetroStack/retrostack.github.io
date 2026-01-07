"use client";

import { useCallback, useRef, useState } from "react";
import { HistoryEntry } from "@/hooks/character-editor";

interface HistorySliderProps<T> {
  /** Full history timeline */
  history: HistoryEntry<T>[];
  /** Current position in history */
  currentIndex: number;
  /** Callback when user jumps to a different position */
  onJump: (index: number) => void;
  /** Whether there are future (redo) entries */
  canRedo?: boolean;
  /** Total entries including future */
  totalEntries?: number;
}

/**
 * History timeline slider for navigating undo/redo states
 * Shows a visual timeline with tick marks and allows jumping to any point
 */
export function HistorySlider<T>({
  history,
  currentIndex,
  onJump,
  canRedo = false,
  totalEntries,
}: HistorySliderProps<T>) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState(0);

  const total = totalEntries ?? history.length;
  const maxIndex = total - 1;

  // Calculate position from index
  const getPositionFromIndex = useCallback(
    (index: number) => {
      if (maxIndex === 0) return 50;
      return (index / maxIndex) * 100;
    },
    [maxIndex]
  );

  // Calculate index from mouse position
  const getIndexFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current || maxIndex === 0) return 0;
      const rect = sliderRef.current.getBoundingClientRect();
      const position = (clientX - rect.left) / rect.width;
      const index = Math.round(position * maxIndex);
      return Math.max(0, Math.min(maxIndex, index));
    },
    [maxIndex]
  );

  // Handle mouse/touch events for dragging
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      const index = getIndexFromPosition(e.clientX);
      onJump(index);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getIndexFromPosition, onJump]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        const index = getIndexFromPosition(e.clientX);
        onJump(index);
      } else {
        // Update hover state
        const index = getIndexFromPosition(e.clientX);
        setHoveredIndex(index);
        if (sliderRef.current) {
          const rect = sliderRef.current.getBoundingClientRect();
          setTooltipPosition(e.clientX - rect.left);
        }
      }
    },
    [isDragging, getIndexFromPosition, onJump]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  // Get label for hovered/current index
  const getLabel = useCallback(
    (index: number) => {
      if (index < 0 || index >= history.length) return null;
      return history[index]?.label || `State ${index}`;
    },
    [history]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        onJump(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < maxIndex) {
        e.preventDefault();
        onJump(currentIndex + 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        onJump(0);
      } else if (e.key === "End") {
        e.preventDefault();
        onJump(maxIndex);
      }
    },
    [currentIndex, maxIndex, onJump]
  );

  // Don't render if no history
  if (history.length <= 1 && !canRedo) {
    return (
      <div className="h-10 flex-shrink-0 bg-retro-navy/50 border-t border-retro-grid/30 flex items-center justify-center">
        <span className="text-[10px] text-gray-500">No history yet</span>
      </div>
    );
  }

  const currentPosition = getPositionFromIndex(currentIndex);
  const hoveredLabel = hoveredIndex !== null ? getLabel(hoveredIndex) : null;
  const currentLabel = getLabel(currentIndex);

  return (
    <div className="h-10 flex-shrink-0 bg-retro-navy/50 border-t border-retro-grid/30 flex items-center px-4 gap-3">
      {/* Position counter */}
      <div className="text-[10px] text-gray-400 w-12 flex-shrink-0 font-mono">
        {currentIndex + 1}/{total}
      </div>

      {/* Slider track */}
      <div
        ref={sliderRef}
        className="flex-1 h-6 relative cursor-pointer select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={maxIndex}
        aria-valuenow={currentIndex}
        aria-label="History timeline"
      >
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-retro-grid/30 rounded-full" />

        {/* Past progress (filled portion) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-retro-cyan/50 rounded-full transition-[width] duration-75"
          style={{ width: `${currentPosition}%` }}
        />

        {/* Tick marks for each history entry */}
        {history.map((entry, index) => {
          const position = getPositionFromIndex(index);
          const isActive = index === currentIndex;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;
          return (
            <div
              key={index}
              className={`absolute top-1/2 -translate-y-1/2 w-1 h-3 rounded-full transition-all duration-75 ${
                isActive
                  ? "bg-retro-cyan"
                  : isPast
                  ? "bg-retro-cyan/40"
                  : isFuture
                  ? "bg-retro-pink/40"
                  : "bg-retro-grid/40"
              }`}
              style={{ left: `${position}%`, transform: "translateX(-50%) translateY(-50%)" }}
            />
          );
        })}

        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all duration-75 ${
            isDragging
              ? "bg-retro-cyan border-white scale-110"
              : "bg-retro-navy border-retro-cyan hover:bg-retro-cyan/20"
          }`}
          style={{ left: `${currentPosition}%`, transform: "translateX(-50%) translateY(-50%)" }}
        />

        {/* Tooltip */}
        {hoveredLabel && !isDragging && (
          <div
            className="absolute bottom-full mb-2 px-2 py-1 bg-retro-dark border border-retro-grid/50 rounded text-[10px] text-white whitespace-nowrap pointer-events-none z-10"
            style={{
              left: tooltipPosition,
              transform: "translateX(-50%)",
            }}
          >
            {hoveredLabel}
          </div>
        )}
      </div>

      {/* Current operation label */}
      <div className="text-[10px] text-gray-400 w-32 flex-shrink-0 truncate text-right" title={currentLabel || undefined}>
        {currentLabel || "—"}
      </div>
    </div>
  );
}
