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
import {
  CRTSettings,
  getScanlinesOpacity,
  getCurvaturePercentage,
  getBloomRadius,
} from "@/lib/character-editor/data/crtSettings";

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

    if (settings.curvature) {
      classes.push("crt-curvature");
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

  // Build CSS custom properties for intensity values
  const customStyles = useMemo<CSSProperties>(() => {
    const styles: Record<string, string> = {};

    if (settings.scanlines) {
      styles["--crt-scanline-opacity"] = String(getScanlinesOpacity(settings.scanlinesIntensity));
    }

    if (settings.curvature) {
      styles["--crt-curvature"] = getCurvaturePercentage(settings.curvatureAmount);
    }

    if (settings.bloom) {
      styles["--crt-bloom-color"] = foregroundColor;
      styles["--crt-bloom-radius"] = getBloomRadius(settings.bloomIntensity);
    }

    return styles as CSSProperties;
  }, [settings, foregroundColor]);

  return (
    <div className={`${effectClasses} ${className}`} style={customStyles}>
      {children}
    </div>
  );
}

CRTEffectsOverlay.displayName = "CRTEffectsOverlay";
