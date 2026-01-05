"use client";

import { useState, useEffect, useRef, RefObject, useCallback } from "react";

interface Size {
  width: number;
  height: number;
}

/**
 * Hook that observes an element's size using ResizeObserver.
 * Useful for dynamic responsive behavior based on container size rather than viewport.
 *
 * @param callback - Optional callback when size changes
 * @returns Object with ref to attach to element and current size
 *
 * @example
 * const { ref, size } = useResizeObserver<HTMLDivElement>();
 * // size.width and size.height update as the element resizes
 */
export function useResizeObserver<T extends HTMLElement = HTMLElement>(
  callback?: (size: Size) => void
): { ref: RefObject<T | null>; size: Size } {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const newSize = { width, height };
        setSize(newSize);
        callback?.(newSize);
      }
    },
    [callback]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(handleResize);
    observer.observe(element);

    // Get initial size
    const rect = element.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    return () => {
      observer.disconnect();
    };
  }, [handleResize]);

  return { ref, size };
}

/**
 * Hook that returns element size without the ref.
 * Use when you already have a ref to an element.
 *
 * @param elementRef - Existing ref to the element
 * @returns Current size of the element
 */
export function useElementSize<T extends HTMLElement>(
  elementRef: RefObject<T | null>
): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(element);

    // Get initial size
    const rect = element.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  return size;
}

/**
 * Hook that calculates how many items can fit in a container.
 * Useful for responsive toolbars and navigation.
 *
 * @param containerRef - Ref to the container element
 * @param itemWidth - Width of each item (including gap)
 * @param minItems - Minimum number of items to always show
 * @returns Number of items that can fit
 */
export function useItemsFit<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  itemWidth: number,
  minItems: number = 1
): number {
  const size = useElementSize(containerRef);

  if (size.width === 0) return minItems;

  const itemsThatFit = Math.floor(size.width / itemWidth);
  return Math.max(itemsThatFit, minItems);
}
