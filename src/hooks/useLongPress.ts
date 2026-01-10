/**
 * Long Press Detection Hook
 *
 * Detects long press gestures on both touch and mouse devices.
 * Used for entering selection mode in grid views (iOS Photos-style).
 *
 * Features:
 * - 500ms default threshold (configurable)
 * - Cancels if finger/cursor moves more than 10px
 * - Prevents context menu on mobile during long press
 * - Distinguishes between long press and regular tap/click
 * - Works with both touch (mobile) and mouse (desktop)
 *
 * @module hooks/useLongPress
 */
"use client";

import { useCallback, useRef } from "react";
import { useTimer } from "@/hooks/useTimer";

export interface UseLongPressOptions {
  /** Threshold in milliseconds before long press triggers (default: 500) */
  threshold?: number;
  /** Callback when long press is detected */
  onLongPress: () => void;
  /** Callback for regular press (only fires if not a long press) */
  onPress?: () => void;
  /** Disable long press detection */
  disabled?: boolean;
  /** Movement threshold in pixels to cancel long press (default: 10) */
  moveThreshold?: number;
}

export interface UseLongPressResult {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent) => void;
}

/**
 * Hook for detecting long press gestures on both touch and mouse devices.
 *
 * Features:
 * - 500ms default threshold (configurable)
 * - Cancels if finger/cursor moves more than 10px
 * - Prevents context menu on mobile during long press
 * - Distinguishes between long press and regular tap/click
 *
 * @example
 * ```tsx
 * const longPressHandlers = useLongPress({
 *   onLongPress: () => enterSelectionMode(index),
 *   onPress: () => selectItem(index),
 * });
 *
 * return <div {...longPressHandlers}>Item</div>;
 * ```
 */
export function useLongPress({
  threshold = 500,
  onLongPress,
  onPress,
  disabled = false,
  moveThreshold = 10,
}: UseLongPressOptions): UseLongPressResult {
  const timer = useTimer();
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const preventContextMenuRef = useRef(false);

  const start = useCallback(
    (x: number, y: number) => {
      if (disabled) return;

      isLongPressRef.current = false;
      startPosRef.current = { x, y };
      preventContextMenuRef.current = false;

      timer.set(() => {
        isLongPressRef.current = true;
        preventContextMenuRef.current = true;
        onLongPress();
      }, threshold);
    },
    [disabled, threshold, onLongPress, timer],
  );

  const end = useCallback(() => {
    timer.clear();

    if (!isLongPressRef.current && onPress && startPosRef.current) {
      onPress();
    }

    startPosRef.current = null;
  }, [timer, onPress]);

  const cancel = useCallback(() => {
    timer.clear();
    startPosRef.current = null;
  }, [timer]);

  const checkMove = useCallback(
    (x: number, y: number) => {
      if (!startPosRef.current) return;

      const dx = Math.abs(x - startPosRef.current.x);
      const dy = Math.abs(y - startPosRef.current.y);

      if (dx > moveThreshold || dy > moveThreshold) {
        cancel();
      }
    },
    [moveThreshold, cancel],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      start(e.clientX, e.clientY);
    },
    [start],
  );

  const onMouseUp = useCallback(() => {
    end();
  }, [end]);

  const onMouseLeave = useCallback(() => {
    cancel();
  }, [cancel]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) {
        cancel();
        return;
      }
      const touch = e.touches[0];
      start(touch.clientX, touch.clientY);
    },
    [start, cancel],
  );

  const onTouchEnd = useCallback(() => {
    end();
  }, [end]);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) {
        cancel();
        return;
      }
      const touch = e.touches[0];
      checkMove(touch.clientX, touch.clientY);
    },
    [checkMove, cancel],
  );

  const onContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent context menu if we're in a long press
    if (preventContextMenuRef.current) {
      e.preventDefault();
    }
  }, []);

  return {
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onContextMenu,
  };
}
