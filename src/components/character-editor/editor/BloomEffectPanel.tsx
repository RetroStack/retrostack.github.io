/**
 * Bloom Effect Panel Component
 *
 * Simple collapsible settings panel for bloom/glow effect.
 * Used in export options where only bloom applies (not scanlines or aspect ratio).
 *
 * @module components/character-editor/editor/BloomEffectPanel
 */
"use client";

import { useState, useCallback } from "react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

export interface BloomEffectSettings {
  /** Whether bloom/glow effect is enabled */
  bloom: boolean;
  /** Bloom intensity (0-100) */
  bloomIntensity: number;
}

export interface BloomEffectPanelProps {
  /** Current bloom settings */
  settings: BloomEffectSettings;
  /** Callback when settings change */
  onChange: (settings: BloomEffectSettings) => void;
  /** Whether panel is collapsed by default */
  defaultCollapsed?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Default bloom intensity */
const DEFAULT_BLOOM_INTENSITY = 40;

/**
 * Collapsible panel for bloom/glow effect settings
 */
export function BloomEffectPanel({
  settings,
  onChange,
  defaultCollapsed = true,
  className = "",
}: BloomEffectPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof BloomEffectSettings>(key: K, value: BloomEffectSettings[K]) => {
      onChange({ ...settings, [key]: value });
    },
    [settings, onChange],
  );

  return (
    <div className={`border border-retro-grid/30 rounded bg-retro-dark/50 ${className}`}>
      {/* Collapsible header */}
      <button
        onClick={toggleCollapsed}
        className="w-full flex items-center justify-between p-2 text-sm text-gray-300 hover:text-retro-cyan transition-colors"
        aria-expanded={!collapsed}
      >
        <span className="font-medium">CRT Effects</span>
        <svg
          className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible content */}
      {!collapsed && (
        <div className="p-3 pt-1 space-y-4 border-t border-retro-grid/30">
          {/* Bloom */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Bloom / Glow</label>
              <ToggleSwitch checked={settings.bloom} onChange={(checked) => updateSetting("bloom", checked)} />
            </div>
            {settings.bloom && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-gray-500">Intensity</label>
                  {settings.bloomIntensity !== DEFAULT_BLOOM_INTENSITY && (
                    <button
                      onClick={() => updateSetting("bloomIntensity", DEFAULT_BLOOM_INTENSITY)}
                      className="text-[10px] text-retro-cyan hover:text-retro-pink"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.bloomIntensity}
                  onChange={(e) => updateSetting("bloomIntensity", Number(e.target.value))}
                  className="w-full h-1.5 accent-retro-cyan"
                />
              </div>
            )}
          </div>

          {/* Info text */}
          <p className="text-[10px] text-gray-500">
            Adds a soft glow around lit pixels, simulating phosphor bloom on CRT displays.
          </p>
        </div>
      )}
    </div>
  );
}

BloomEffectPanel.displayName = "BloomEffectPanel";
