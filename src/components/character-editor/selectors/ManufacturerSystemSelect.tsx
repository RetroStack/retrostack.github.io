"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { KNOWN_MANUFACTURERS, getSystemsForManufacturer } from "@/lib/character-editor/data/manufacturers";

export interface ManufacturerSystemSelectProps {
  /** Currently selected manufacturer */
  manufacturer: string;
  /** Currently selected system */
  system: string;
  /** Callback when manufacturer changes */
  onManufacturerChange: (manufacturer: string) => void;
  /** Callback when system changes */
  onSystemChange: (system: string) => void;
  /** Whether the selects are disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Display manufacturer and system as two editable inputs with a picker dropdown
 */
export function ManufacturerSystemSelect({
  manufacturer,
  system,
  onManufacturerChange,
  onSystemChange,
  disabled = false,
  className = "",
}: ManufacturerSystemSelectProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sort manufacturers alphabetically
  const sortedManufacturers = useMemo(() => {
    return [...KNOWN_MANUFACTURERS].sort((a, b) =>
      a.manufacturer.localeCompare(b.manufacturer)
    );
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleManufacturerClick = (mfr: string) => {
    onManufacturerChange(mfr);
    onSystemChange("");
    setIsDropdownOpen(false);
  };

  const handleSystemClick = (mfr: string, sys: string) => {
    onManufacturerChange(mfr);
    onSystemChange(sys);
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    onManufacturerChange("");
    onSystemChange("");
    setIsDropdownOpen(false);
  };

  const inputClasses = `
    flex-1 min-w-0 px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white
    placeholder-gray-500 focus:outline-none focus:border-retro-cyan
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Manufacturer input */}
      <input
        type="text"
        value={manufacturer}
        onChange={(e) => onManufacturerChange(e.target.value)}
        placeholder="Manufacturer"
        disabled={disabled}
        className={inputClasses}
      />

      {/* System input */}
      <input
        type="text"
        value={system}
        onChange={(e) => onSystemChange(e.target.value)}
        placeholder="System"
        disabled={disabled}
        className={inputClasses}
      />

      {/* Picker dropdown */}
      <div ref={dropdownRef} className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className="px-3 py-2 bg-gradient-to-b from-gray-600/50 to-gray-700/50 border border-retro-cyan/50 border-t-retro-cyan/70 hover:from-gray-500/50 hover:to-gray-600/50 hover:border-retro-cyan active:from-gray-700/50 active:to-gray-800/50 shadow-md shadow-black/30 active:shadow-sm rounded text-sm text-retro-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Select manufacturer and system"
        >
          ...
        </button>

        {/* Dropdown panel */}
        {isDropdownOpen && (
          <div
            className="absolute z-50 top-full mt-1 max-h-80 overflow-y-auto bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl"
            style={{ width: '240px', right: 0 }}
          >
            {/* Clear option */}
            {(manufacturer || system) && (
              <div className="p-2 border-b border-retro-grid/30">
                <button
                  onClick={handleClear}
                  className="w-full text-left px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-retro-grid/20 rounded transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}

            {/* Manufacturers and systems */}
            <div className="p-2">
              {sortedManufacturers.map((mfr) => (
                <div key={mfr.manufacturer} className="mb-3 last:mb-0">
                  {/* Manufacturer header - clickable */}
                  <button
                    onClick={() => handleManufacturerClick(mfr.manufacturer)}
                    className={`w-full text-left px-2 py-1 text-xs font-medium rounded transition-all ${
                      manufacturer === mfr.manufacturer && !system
                        ? "text-retro-cyan bg-retro-cyan/30 ring-1 ring-retro-cyan"
                        : "text-retro-cyan bg-retro-cyan/10 hover:bg-retro-cyan/20 hover:text-white"
                    }`}
                  >
                    {mfr.manufacturer}
                  </button>

                  {/* Systems for this manufacturer */}
                  <div className="ml-3 mt-1 flex flex-wrap gap-1">
                    {mfr.systems.map((sys) => (
                      <button
                        key={sys}
                        onClick={() => handleSystemClick(mfr.manufacturer, sys)}
                        className={`px-2 py-0.5 text-xs rounded transition-all ${
                          manufacturer === mfr.manufacturer && system === sys
                            ? "bg-retro-amber/40 text-retro-amber ring-1 ring-retro-amber"
                            : "bg-retro-amber/15 text-retro-amber hover:bg-retro-amber/30 hover:text-white"
                        }`}
                      >
                        {sys}
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

/**
 * Compact version for use in filters
 */
export function ManufacturerSystemSelectCompact({
  manufacturer,
  system,
  onManufacturerChange,
  onSystemChange,
  disabled = false,
  className = "",
}: ManufacturerSystemSelectProps) {
  const allManufacturers = useMemo(() => KNOWN_MANUFACTURERS.map((m) => m.manufacturer), []);
  const availableSystems = useMemo(() => {
    if (!manufacturer) return [];
    return getSystemsForManufacturer(manufacturer);
  }, [manufacturer]);

  const selectClasses = `
    px-2 py-1.5 bg-retro-navy/50 border border-retro-grid/50 rounded
    text-xs text-gray-200 focus:outline-none focus:border-retro-cyan/50
    transition-colors disabled:opacity-50
  `;

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        value={manufacturer}
        onChange={(e) => {
          onManufacturerChange(e.target.value);
          if (e.target.value !== manufacturer) onSystemChange("");
        }}
        disabled={disabled}
        className={selectClasses}
      >
        <option value="">All manufacturers</option>
        {allManufacturers.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={system}
        onChange={(e) => onSystemChange(e.target.value)}
        disabled={disabled || !manufacturer}
        className={selectClasses}
      >
        <option value="">{manufacturer ? "All systems" : "Select manufacturer..."}</option>
        {availableSystems.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
