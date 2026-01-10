/**
 * Media Query Hook
 *
 * Tracks whether a CSS media query matches, with SSR safety.
 * Includes predefined hooks for common breakpoints matching Tailwind CSS:
 * - useIsMobile: max-width 639px
 * - useIsTablet: 640px to 1023px
 * - useIsDesktop: min-width 1024px
 * - useIsWideDesktop: min-width 1280px
 * - usePrefersTouch: pointer: coarse (touch devices)
 * - usePrefersReducedMotion: prefers-reduced-motion: reduce
 *
 * @module hooks/useMediaQuery
 */
"use client";

import { useState, useEffect } from "react";

/**
 * Get initial match state for SSR safety
 */
function getInitialMatch(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

/**
 * Hook that tracks whether a media query matches.
 * Useful for responsive logic in components.
 *
 * @param query - Media query string (e.g., "(max-width: 640px)")
 * @returns Boolean indicating if the media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 640px)');
 * const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
 * const isDesktop = useMediaQuery('(min-width: 1025px)');
 * const prefersTouch = useMediaQuery('(pointer: coarse)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => getInitialMatch(query));

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Sync state if it differs from initial (handles SSR hydration)
    if (mediaQuery.matches !== matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional sync for SSR hydration
      setMatches(mediaQuery.matches);
    }

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener using the modern API
    mediaQuery.addEventListener("change", handler);

    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query, matches]);

  return matches;
}

/**
 * Predefined breakpoint hooks for common responsive patterns.
 * These match Tailwind CSS default breakpoints.
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function useIsWideDesktop(): boolean {
  return useMediaQuery("(min-width: 1280px)");
}

export function usePrefersTouch(): boolean {
  return useMediaQuery("(pointer: coarse)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
