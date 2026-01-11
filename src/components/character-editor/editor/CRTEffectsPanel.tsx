/**
 * CRT Effects Panel Component
 *
 * Collapsible settings panel for CRT simulation effects.
 * Features toggle switches for each effect with intensity sliders
 * and a dropdown for pixel aspect ratio selection.
 *
 * @module components/character-editor/editor/CRTEffectsPanel
 */
"use client";

import { useState, useCallback } from "react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";
import {
  CRTSettings,
  DEFAULT_CRT_SETTINGS,
  PixelAspectRatio,
  PIXEL_ASPECT_RATIO_LABELS,
} from "@/lib/character-editor/data/crtSettings";

export interface CRTEffectsPanelProps {
  /** Current CRT settings */
  settings: CRTSettings;
  /** Callback when settings change */
  onChange: (settings: CRTSettings) => void;
  /** Whether panel is collapsed by default */
  defaultCollapsed?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Pixel aspect ratio options for dropdown */
const ASPECT_RATIO_OPTIONS: { value: PixelAspectRatio; label: string }[] = [
  { value: "none", label: PIXEL_ASPECT_RATIO_LABELS.none },
  { value: "pal", label: PIXEL_ASPECT_RATIO_LABELS.pal },
  { value: "ntsc", label: PIXEL_ASPECT_RATIO_LABELS.ntsc },
];

/**
 * Collapsible panel for CRT simulation effect settings
 */
export function CRTEffectsPanel({
  settings,
  onChange,
  defaultCollapsed = true,
  className = "",
}: CRTEffectsPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof CRTSettings>(key: K, value: CRTSettings[K]) => {
      onChange({ ...settings, [key]: value });
    },
    [settings, onChange]
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
          {/* Scanlines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Scanlines</label>
              <ToggleSwitch
                checked={settings.scanlines}
                onChange={(checked) => updateSetting("scanlines", checked)}
              />
            </div>
            {settings.scanlines && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-gray-500">Intensity</label>
                  {settings.scanlinesIntensity !== DEFAULT_CRT_SETTINGS.scanlinesIntensity && (
                    <button
                      onClick={() => updateSetting("scanlinesIntensity", DEFAULT_CRT_SETTINGS.scanlinesIntensity)}
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
                  value={settings.scanlinesIntensity}
                  onChange={(e) => updateSetting("scanlinesIntensity", Number(e.target.value))}
                  className="w-full h-1.5 accent-retro-cyan"
                />
              </div>
            )}
          </div>

          {/* Curvature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Screen Curvature</label>
              <ToggleSwitch
                checked={settings.curvature}
                onChange={(checked) => updateSetting("curvature", checked)}
              />
            </div>
            {settings.curvature && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-gray-500">Amount</label>
                  {settings.curvatureAmount !== DEFAULT_CRT_SETTINGS.curvatureAmount && (
                    <button
                      onClick={() => updateSetting("curvatureAmount", DEFAULT_CRT_SETTINGS.curvatureAmount)}
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
                  value={settings.curvatureAmount}
                  onChange={(e) => updateSetting("curvatureAmount", Number(e.target.value))}
                  className="w-full h-1.5 accent-retro-cyan"
                />
              </div>
            )}
          </div>

          {/* Bloom */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Bloom / Glow</label>
              <ToggleSwitch
                checked={settings.bloom}
                onChange={(checked) => updateSetting("bloom", checked)}
              />
            </div>
            {settings.bloom && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-gray-500">Intensity</label>
                  {settings.bloomIntensity !== DEFAULT_CRT_SETTINGS.bloomIntensity && (
                    <button
                      onClick={() => updateSetting("bloomIntensity", DEFAULT_CRT_SETTINGS.bloomIntensity)}
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

          {/* Pixel Aspect Ratio */}
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Pixel Aspect Ratio</label>
            <SingleSelectDropdown
              options={ASPECT_RATIO_OPTIONS}
              value={settings.pixelAspectRatio}
              onChange={(value) => updateSetting("pixelAspectRatio", value)}
              ariaLabel="Select pixel aspect ratio"
            />
          </div>
        </div>
      )}
    </div>
  );
}

CRTEffectsPanel.displayName = "CRTEffectsPanel";
