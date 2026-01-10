/**
 * Timer Management Hooks
 *
 * Provides useTimer for setTimeout and useInterval for setInterval
 * with automatic cleanup on unmount. Prevents memory leaks and
 * ensures only one timer/interval is active at a time per hook instance.
 *
 * Common use cases:
 * - Debounced actions (e.g., search input)
 * - Long press detection
 * - Auto-save intervals
 * - Animation delays
 *
 * @module hooks/useTimer
 */
"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * Result of the useTimer hook
 */
export interface UseTimerResult {
  /** Set a new timer. Clears any existing timer first. */
  set: (callback: () => void, delay: number) => void;
  /** Clear the current timer if one exists */
  clear: () => void;
  /** Whether a timer is currently active */
  isActive: boolean;
}

/**
 * Hook for managing setTimeout with automatic cleanup.
 * Prevents memory leaks by clearing timers on unmount and
 * ensures only one timer is active at a time.
 *
 * @example
 * ```tsx
 * function DelayedAction() {
 *   const timer = useTimer();
 *
 *   const handleClick = () => {
 *     timer.set(() => {
 *       console.log('Delayed action!');
 *     }, 1000);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleClick}>Start</button>
 *       <button onClick={timer.clear} disabled={!timer.isActive}>
 *         Cancel
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Long press detection
 * const timer = useTimer();
 *
 * const onTouchStart = () => {
 *   timer.set(() => onLongPress(), 500);
 * };
 *
 * const onTouchEnd = () => {
 *   if (timer.isActive) {
 *     // Was a short press, not long press
 *     timer.clear();
 *     onShortPress();
 *   }
 * };
 * ```
 */
export function useTimer(): UseTimerResult {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track active state in a ref for synchronous access
  const isActiveRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      isActiveRef.current = false;
    }
  }, []);

  const set = useCallback(
    (callback: () => void, delay: number) => {
      // Clear any existing timer first
      clear();

      isActiveRef.current = true;
      timerRef.current = setTimeout(() => {
        isActiveRef.current = false;
        timerRef.current = null;
        callback();
      }, delay);
    },
    [clear],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  return {
    set,
    clear,
    // Return current state - note this won't trigger re-renders
    // For UI that needs to react to timer state, use useState instead
    get isActive() {
      return isActiveRef.current;
    },
  };
}

/**
 * Hook for managing setInterval with automatic cleanup.
 * Similar to useTimer but for repeating intervals.
 *
 * @example
 * ```tsx
 * function AutoSave() {
 *   const interval = useInterval();
 *
 *   useEffect(() => {
 *     interval.set(() => saveData(), 30000);
 *   }, []);
 *
 *   return <div>Auto-saving every 30s...</div>;
 * }
 * ```
 */
export function useInterval(): UseTimerResult {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(false);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      isActiveRef.current = false;
    }
  }, []);

  const set = useCallback(
    (callback: () => void, delay: number) => {
      // Clear any existing interval first
      clear();

      isActiveRef.current = true;
      intervalRef.current = setInterval(callback, delay);
    },
    [clear],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  return {
    set,
    clear,
    get isActive() {
      return isActiveRef.current;
    },
  };
}
