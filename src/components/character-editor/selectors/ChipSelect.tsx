"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ROM_CHIPS, RomChipInfo } from "@/lib/character-editor/data/manufacturers";

export interface ChipSelectProps {
  /** Currently selected chip (part number) */
  chip: string;
  /** Callback when chip changes */
  onChipChange: (chip: string) => void;
  /** Optional system to filter/highlight compatible chips */
  system?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get chips grouped by manufacturer
 */
function getChipsByManufacturer(): Record<string, RomChipInfo[]> {
  const grouped: Record<string, RomChipInfo[]> = {};
  for (const chip of ROM_CHIPS) {
    if (!grouped[chip.manufacturer]) {
      grouped[chip.manufacturer] = [];
    }
    grouped[chip.manufacturer].push(chip);
  }
  return grouped;
}

/**
 * Display chip as editable input with a picker dropdown
 */
export function ChipSelect({ chip, onChipChange, system, disabled = false, className = "" }: ChipSelectProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get chips grouped by manufacturer, sorted alphabetically
  const chipsByManufacturer = useMemo(() => {
    const grouped = getChipsByManufacturer();
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, []);

  // Get chips compatible with selected system
  const compatibleChipIds = useMemo(() => {
    if (!system) return new Set<string>();
    return new Set(
      ROM_CHIPS.filter((c) => c.usedIn.some((s) => s.toLowerCase() === system.toLowerCase())).map((c) => c.id),
    );
  }, [system]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChipClick = (partNumber: string, chipManufacturer: string) => {
    onChipChange(`${chipManufacturer} ${partNumber}`);
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    onChipChange("");
    setIsDropdownOpen(false);
  };

  const isSelected = (partNumber: string, chipManufacturer: string) =>
    chip === `${chipManufacturer} ${partNumber}` || chip === partNumber;

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Chip input */}
      <input
        type="text"
        value={chip}
        onChange={(e) => onChipChange(e.target.value)}
        placeholder="e.g. MOS Technology 901225-01"
        disabled={disabled}
        className="flex-1 min-w-0 px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Picker dropdown */}
      <div ref={dropdownRef} className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className="px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-gray-400 hover:text-white hover:border-retro-grid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Select ROM chip"
        >
          ...
        </button>

        {/* Dropdown panel */}
        {isDropdownOpen && (
          <div
            className="absolute z-50 top-full mt-1 max-h-80 overflow-y-auto bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl"
            style={{ width: "240px", right: 0 }}
          >
            {/* Clear option */}
            {chip && (
              <div className="p-2 border-b border-retro-grid/30">
                <button
                  onClick={handleClear}
                  className="w-full text-left px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-retro-grid/20 rounded transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}

            {/* Compatible chips section (if system is selected) */}
            {system && compatibleChipIds.size > 0 && (
              <div className="p-2 border-b border-retro-grid/30">
                <div className="text-[10px] text-retro-cyan uppercase font-medium mb-2">Compatible with {system}</div>
                <div className="flex flex-wrap gap-1">
                  {ROM_CHIPS.filter((c) => compatibleChipIds.has(c.id)).map((chipInfo) => (
                    <button
                      key={chipInfo.id}
                      onClick={() => handleChipClick(chipInfo.partNumber, chipInfo.manufacturer)}
                      title={`${chipInfo.manufacturer} - ${chipInfo.type} - ${chipInfo.glyph.width}x${chipInfo.glyph.height}`}
                      className={`px-2 py-0.5 text-xs rounded transition-all ${
                        isSelected(chipInfo.partNumber, chipInfo.manufacturer)
                          ? "bg-retro-amber/40 text-retro-amber ring-1 ring-retro-amber"
                          : "bg-retro-amber/15 text-retro-amber hover:bg-retro-amber/30 hover:text-white"
                      }`}
                    >
                      {chipInfo.partNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All chips by manufacturer */}
            <div className="p-2">
              {chipsByManufacturer.map(([manufacturer, chips]) => (
                <div key={manufacturer} className="mb-3 last:mb-0">
                  {/* Manufacturer header */}
                  <div className="w-full text-left px-2 py-1 text-xs font-medium text-retro-cyan bg-retro-cyan/10 rounded">
                    {manufacturer}
                  </div>

                  {/* Chips for this manufacturer */}
                  <div className="ml-3 mt-1 flex flex-wrap gap-1">
                    {chips.map((chipInfo) => (
                      <button
                        key={chipInfo.id}
                        onClick={() => handleChipClick(chipInfo.partNumber, chipInfo.manufacturer)}
                        title={`${chipInfo.type} - ${chipInfo.glyph.width}x${chipInfo.glyph.height}${
                          chipInfo.usedIn.length > 0 ? ` - Used in: ${chipInfo.usedIn.join(", ")}` : ""
                        }`}
                        className={`px-2 py-0.5 text-xs rounded transition-all ${
                          isSelected(chipInfo.partNumber, chipInfo.manufacturer)
                            ? "bg-retro-amber/40 text-retro-amber ring-1 ring-retro-amber"
                            : "bg-retro-amber/15 text-retro-amber hover:bg-retro-amber/30 hover:text-white"
                        }`}
                      >
                        {chipInfo.partNumber}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
