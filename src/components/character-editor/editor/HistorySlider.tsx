"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { HistoryEntry } from "@/hooks/character-editor/useUndoRedo";

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
  /** Callback when user wants to clear history */
  onClear?: () => void;
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
  onClear,
}: HistorySliderProps<T>) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
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
    [maxIndex],
  );

  // Calculate index from client X position
  const getIndexFromClientX = useCallback(
    (clientX: number) => {
      if (!sliderRef.current || maxIndex === 0) return 0;
      const rect = sliderRef.current.getBoundingClientRect();
      const position = (clientX - rect.left) / rect.width;
      const index = Math.round(position * maxIndex);
      return Math.max(0, Math.min(maxIndex, index));
    },
    [maxIndex],
  );

  // Store onJump in a ref so window event handlers always have the latest version
  const onJumpRef = useRef(onJump);
  const getIndexFromClientXRef = useRef(getIndexFromClientX);

  // Keep refs up to date
  useEffect(() => {
    onJumpRef.current = onJump;
    getIndexFromClientXRef.current = getIndexFromClientX;
  }, [onJump, getIndexFromClientX]);

  // Window-level move handler for reliable dragging on touch devices
  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const index = getIndexFromClientXRef.current(e.clientX);
      onJumpRef.current(index);
    };

    const handleWindowPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    // Use passive: false to allow preventDefault if needed
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, []);

  // Handle pointer down on the slider
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault(); // Prevent text selection and other default behaviors
      isDraggingRef.current = true;
      setIsDragging(true);
      const index = getIndexFromClientX(e.clientX);
      onJump(index);
    },
    [getIndexFromClientX, onJump],
  );

  // Handle hover (only when not dragging)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isDraggingRef.current) return; // Handled by window listener
      const index = getIndexFromClientX(e.clientX);
      setHoveredIndex(index);
      if (sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        setTooltipPosition(e.clientX - rect.left);
      }
    },
    [getIndexFromClientX],
  );

  const handlePointerLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  // Get label for hovered/current index
  const getLabel = useCallback(
    (index: number) => {
      if (index < 0 || index >= history.length) return null;
      return history[index]?.label || `State ${index}`;
    },
    [history],
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
    [currentIndex, maxIndex, onJump],
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
        style={{ touchAction: "none" }} // Prevent browser handling touch gestures
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
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
      <div
        className="text-[10px] text-gray-400 w-32 flex-shrink-0 truncate text-right"
        title={currentLabel || undefined}
      >
        {currentLabel || "—"}
      </div>

      {/* Clear history button */}
      {onClear && history.length > 1 && (
        <button
          type="button"
          onClick={onClear}
          className="flex-shrink-0 p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          title="Clear history"
          aria-label="Clear history"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      )}
    </div>
  );
}
