"use client";

import { useEffect, useRef, RefObject } from "react";

/**
 * Hook that detects clicks outside of a specified element.
 * Useful for closing dropdowns, modals, and popovers.
 *
 * @param callback - Function to call when a click outside is detected
 * @param enabled - Whether the listener is active (default: true)
 * @returns A ref to attach to the element to monitor
 */
export function useOutsideClick<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  enabled: boolean = true
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        callback();
      }
    };

    // Use mousedown and touchstart for faster response
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [callback, enabled]);

  return ref;
}
