/**
 * Manufacturer System Select Component
 *
 * A dual-input selector for manufacturer and system metadata.
 * Features:
 * - Two editable text inputs (manufacturer and system)
 * - 3D picker button opens dropdown with known values
 * - Systems auto-filter based on selected manufacturer
 * - Clear button to reset both fields
 * - Custom values allowed via direct text input
 *
 * @module components/character-editor/selectors/ManufacturerSystemSelect
 */
"use client";

import { useMemo, useState, useCallback } from "react";
import { KNOWN_MANUFACTURERS, getSystemsForManufacturer } from "@/lib/character-editor/data/systems";
import { useDropdown } from "@/hooks/useDropdown";
import {
  DropdownPanel,
  DropdownGroup,
  DropdownChipButton,
  DropdownClearButton,
  Picker3DButton,
  pickerInputClasses,
} from "@/components/ui/DropdownPrimitives";
import { SingleSelectDropdown } from "@/components/ui/SingleSelectDropdown";

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
  const { ref: dropdownRef, isOpen, toggle, close } = useDropdown<HTMLDivElement>();
  const [searchQuery, setSearchQuery] = useState("");

  // Wrapper for toggle that clears search when opening
  const handleToggle = useCallback(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
    toggle();
  }, [isOpen, toggle]);

  // Sort manufacturers alphabetically
  const sortedManufacturers = useMemo(() => {
    return [...KNOWN_MANUFACTURERS].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filter manufacturers and systems based on search query
  const filteredManufacturers = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedManufacturers;
    }

    const query = searchQuery.toLowerCase().trim();

    return sortedManufacturers
      .map((mfr) => {
        const manufacturerMatches = mfr.name.toLowerCase().includes(query);
        const matchingSystems = mfr.systems.filter(
          (sys) => manufacturerMatches || sys.toLowerCase().includes(query)
        );

        if (matchingSystems.length === 0) {
          return null;
        }

        return {
          name: mfr.name,
          systems: matchingSystems,
        };
      })
      .filter((mfr): mfr is NonNullable<typeof mfr> => mfr !== null);
  }, [sortedManufacturers, searchQuery]);

  const handleManufacturerClick = (mfr: string) => {
    onManufacturerChange(mfr);
    onSystemChange("");
    close();
    setSearchQuery("");
  };

  const handleSystemClick = (mfr: string, sys: string) => {
    onManufacturerChange(mfr);
    onSystemChange(sys);
    close();
    setSearchQuery("");
  };

  const handleClear = () => {
    onManufacturerChange("");
    onSystemChange("");
    close();
    setSearchQuery("");
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Manufacturer input */}
      <input
        type="text"
        value={manufacturer}
        onChange={(e) => onManufacturerChange(e.target.value)}
        placeholder="Manufacturer"
        disabled={disabled}
        className={pickerInputClasses}
      />

      {/* System input */}
      <input
        type="text"
        value={system}
        onChange={(e) => onSystemChange(e.target.value)}
        placeholder="System"
        disabled={disabled}
        className={pickerInputClasses}
      />

      {/* Picker dropdown */}
      <div ref={dropdownRef} className="relative flex-shrink-0">
        <Picker3DButton onClick={handleToggle} disabled={disabled} title="Select manufacturer and system" />

        {/* Dropdown panel */}
        {isOpen && (
          <DropdownPanel width={420} maxHeight={400}>
            {/* Search input - sticky at top */}
            <div className="sticky top-0 z-10 p-2 border-b border-retro-grid/30 bg-retro-navy">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search manufacturers or systems..."
                autoFocus
                className="w-full px-3 py-1.5 text-sm bg-retro-dark border border-retro-grid/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
              />
            </div>

            {/* Clear option */}
            {(manufacturer || system) && !searchQuery && <DropdownClearButton onClick={handleClear} />}

            {/* Manufacturers and systems */}
            <div className="p-2">
              {filteredManufacturers.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-4">No manufacturers or systems found</div>
              ) : (
                filteredManufacturers.map((mfr) => (
                  <DropdownGroup
                    key={mfr.name}
                    label={mfr.name}
                    onClick={() => handleManufacturerClick(mfr.name)}
                    isSelected={manufacturer === mfr.name && !system}
                  >
                    {mfr.systems.map((sys) => (
                      <DropdownChipButton
                        key={sys}
                        label={sys}
                        isSelected={manufacturer === mfr.name && system === sys}
                        onClick={() => handleSystemClick(mfr.name, sys)}
                      />
                    ))}
                  </DropdownGroup>
                ))
              )}
            </div>
          </DropdownPanel>
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
  const allManufacturers = useMemo(() => KNOWN_MANUFACTURERS.map((m) => m.name), []);
  const availableSystems = useMemo(() => {
    if (!manufacturer) return [];
    return getSystemsForManufacturer(manufacturer);
  }, [manufacturer]);

  const manufacturerOptions = useMemo(
    () => [
      { value: "", label: "All manufacturers" },
      ...allManufacturers.map((m) => ({ value: m, label: m })),
    ],
    [allManufacturers]
  );

  const systemOptions = useMemo(
    () => [
      { value: "", label: manufacturer ? "All systems" : "Select manufacturer..." },
      ...availableSystems.map((s) => ({ value: s, label: s })),
    ],
    [manufacturer, availableSystems]
  );

  const handleManufacturerChange = (value: string) => {
    onManufacturerChange(value);
    if (value !== manufacturer) onSystemChange("");
  };

  if (disabled) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <div className="px-3 py-1.5 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-400 opacity-50">
          {manufacturer || "All manufacturers"}
        </div>
        <div className="px-3 py-1.5 bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-400 opacity-50">
          {system || (manufacturer ? "All systems" : "Select manufacturer...")}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <SingleSelectDropdown
        options={manufacturerOptions}
        value={manufacturer}
        onChange={handleManufacturerChange}
        className="min-w-[140px]"
        ariaLabel="Select manufacturer"
      />

      <SingleSelectDropdown
        options={systemOptions}
        value={system}
        onChange={onSystemChange}
        className="min-w-[140px]"
        ariaLabel="Select system"
      />
    </div>
  );
}
