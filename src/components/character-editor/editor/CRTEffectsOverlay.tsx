/**
 * CRT Effects Overlay Component
 *
 * Wraps content and applies CRT simulation effects based on settings.
 * Uses CSS classes and custom properties for GPU-accelerated effects.
 *
 * @module components/character-editor/editor/CRTEffectsOverlay
 */
"use client";

import { useMemo, CSSProperties, ReactNode } from "react";
import { CRTSettings } from "@/lib/character-editor/data/crtSettings";

export interface CRTEffectsOverlayProps {
  /** CRT effect settings */
  settings: CRTSettings;
  /** Foreground color for bloom effect */
  foregroundColor?: string;
  /** Content to wrap */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Wrapper component that applies CRT simulation effects to its children
 */
export function CRTEffectsOverlay({
  settings,
  foregroundColor = "#ffffff",
  children,
  className = "",
}: CRTEffectsOverlayProps) {
  // Build CSS classes based on enabled effects
  const effectClasses = useMemo(() => {
    const classes: string[] = ["crt-container"];

    if (settings.scanlines) {
      classes.push("crt-scanlines");
    }

    if (settings.bloom) {
      classes.push("crt-bloom");
    }

    if (settings.pixelAspectRatio === "pal") {
      classes.push("crt-pal");
    } else if (settings.pixelAspectRatio === "ntsc") {
      classes.push("crt-ntsc");
    }

    return classes.join(" ");
  }, [settings]);

  // Build CSS custom properties for effect values
  const customStyles = useMemo<CSSProperties>(() => {
    const styles: Record<string, string> = {};

    if (settings.scanlines) {
      // Map intensity 0-100 to opacity 0-0.5 for scanlines
      styles["--crt-scanlines-opacity"] = String((settings.scanlinesIntensity / 100) * 0.5);
    }

    if (settings.bloom) {
      styles["--crt-bloom-color"] = foregroundColor;
    }

    return styles as CSSProperties;
  }, [settings.scanlines, settings.scanlinesIntensity, settings.bloom, foregroundColor]);

  return (
    <div className={`${effectClasses} ${className}`} style={customStyles}>
      <div
        style={{
          // Clip bloom glow at container boundaries to prevent bleeding outside
          ...(settings.bloom ? { overflow: "hidden" } : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}

CRTEffectsOverlay.displayName = "CRTEffectsOverlay";
