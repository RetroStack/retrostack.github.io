/**
 * Grid Background Effect
 *
 * A visual effect component that creates a retro-style grid background
 * commonly seen in 80s/90s tech aesthetics. Features:
 * - CSS-based grid pattern (defined in globals.css)
 * - Optional animation for subtle movement
 * - Optional gradient overlay for depth
 *
 * Uses forwardRef for compatibility with parent positioning.
 *
 * @module components/effects/GridBackground
 *
 * @example
 * ```tsx
 * <GridBackground animated overlay>
 *   <YourContent />
 * </GridBackground>
 * ```
 */
"use client";

import { HTMLAttributes, forwardRef } from "react";

interface GridBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
  overlay?: boolean;
}

export const GridBackground = forwardRef<HTMLDivElement, GridBackgroundProps>(
  ({ className = "", animated = true, overlay = true, children, ...props }, ref) => {
    const gridStyles = animated ? "grid-background grid-animated" : "grid-background";

    return (
      <div
        ref={ref}
        className={`relative ${gridStyles} ${className}`}
        {...props}
      >
        {children}
        {overlay && (
          <div className="pointer-events-none absolute inset-0 gradient-overlay" />
        )}
      </div>
    );
  }
);

GridBackground.displayName = "GridBackground";
