"use client";

import { useState, useRef, useEffect } from "react";
import {
  DIMENSION_PRESETS,
  SYSTEM_PRESETS,
  getSystemPresetsByMaker,
} from "@/lib/character-editor";

export interface SizePresetDropdownProps {
  /** Current width */
  currentWidth: number;
  /** Current height */
  currentHeight: number;
  /** Callback when a preset is selected */
  onSelect: (width: number, height: number) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Dropdown component for selecting character dimension presets
 * Shows quick presets and a dropdown with system-organized options
 */
export function SizePresetDropdown({
  currentWidth,
  currentHeight,
  onSelect,
  className = "",
}: SizePresetDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Common quick presets (shown as buttons)
  const quickPresets = [
    { label: "8x8", width: 8, height: 8 },
    { label: "8x16", width: 8, height: 16 },
    { label: "5x7", width: 5, height: 7 },
  ];

  // Group system presets by maker
  const presetsByMaker = getSystemPresetsByMaker();

  const isCurrentPreset = (w: number, h: number) =>
    currentWidth === w && currentHeight === h;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Quick preset buttons */}
      <div className="flex flex-wrap gap-2 mb-2">
        {quickPresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onSelect(preset.width, preset.height)}
            className={`
              px-2 py-1 text-xs rounded border transition-colors
              ${
                isCurrentPreset(preset.width, preset.height)
                  ? "border-retro-pink bg-retro-pink/10 text-retro-pink"
                  : "border-retro-grid/50 text-gray-400 hover:border-retro-grid"
              }
            `}
          >
            {preset.label}
          </button>
        ))}

        {/* Dropdown toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-1 text-xs rounded border border-retro-grid/50 text-gray-400 hover:border-retro-grid flex items-center gap-1"
        >
          More
          <svg
            className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-10 left-0 top-full mt-1 w-64 max-h-80 overflow-y-auto bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl">
          {/* All dimension presets */}
          <div className="p-2 border-b border-retro-grid/30">
            <div className="text-[10px] text-gray-500 uppercase mb-1">
              Standard Formats
            </div>
            <div className="flex flex-wrap gap-1">
              {DIMENSION_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    onSelect(preset.width, preset.height);
                    setIsOpen(false);
                  }}
                  className={`
                    px-2 py-1 text-xs rounded transition-colors
                    ${
                      isCurrentPreset(preset.width, preset.height)
                        ? "bg-retro-pink/20 text-retro-pink"
                        : "text-gray-400 hover:bg-retro-grid/20"
                    }
                  `}
                  title={preset.systems.join(", ")}
                >
                  {preset.width}x{preset.height}
                </button>
              ))}
            </div>
          </div>

          {/* System-organized presets */}
          {Object.entries(presetsByMaker)
            .filter(([, presets]) => presets.length > 0)
            .map(([maker, presets]) => (
              <div
                key={maker}
                className="p-2 border-b border-retro-grid/30 last:border-0"
              >
                <div className="text-[10px] text-gray-500 uppercase mb-1">
                  {maker}
                </div>
                <div className="flex flex-wrap gap-1">
                  {presets.map((preset) => (
                    <button
                      key={`${preset.system}-${preset.width}x${preset.height}`}
                      onClick={() => {
                        onSelect(preset.width, preset.height);
                        setIsOpen(false);
                      }}
                      className={`
                        px-2 py-1 text-xs rounded transition-colors
                        ${
                          isCurrentPreset(preset.width, preset.height)
                            ? "bg-retro-cyan/20 text-retro-cyan"
                            : "text-gray-400 hover:bg-retro-grid/20"
                        }
                      `}
                    >
                      {preset.system}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
