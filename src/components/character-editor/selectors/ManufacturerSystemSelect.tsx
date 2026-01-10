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

import { useMemo } from "react";
import { KNOWN_MANUFACTURERS, getSystemsForManufacturer } from "@/lib/character-editor/data/manufacturers";
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
  const dropdown = useDropdown<HTMLDivElement>();

  // Sort manufacturers alphabetically
  const sortedManufacturers = useMemo(() => {
    return [...KNOWN_MANUFACTURERS].sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));
  }, []);

  const handleManufacturerClick = (mfr: string) => {
    onManufacturerChange(mfr);
    onSystemChange("");
    dropdown.close();
  };

  const handleSystemClick = (mfr: string, sys: string) => {
    onManufacturerChange(mfr);
    onSystemChange(sys);
    dropdown.close();
  };

  const handleClear = () => {
    onManufacturerChange("");
    onSystemChange("");
    dropdown.close();
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
      <div ref={dropdown.ref} className="relative flex-shrink-0">
        <Picker3DButton onClick={dropdown.toggle} disabled={disabled} title="Select manufacturer and system" />

        {/* Dropdown panel */}
        {dropdown.isOpen && (
          <DropdownPanel>
            {/* Clear option */}
            {(manufacturer || system) && <DropdownClearButton onClick={handleClear} />}

            {/* Manufacturers and systems */}
            <div className="p-2">
              {sortedManufacturers.map((mfr) => (
                <DropdownGroup
                  key={mfr.manufacturer}
                  label={mfr.manufacturer}
                  onClick={() => handleManufacturerClick(mfr.manufacturer)}
                  isSelected={manufacturer === mfr.manufacturer && !system}
                >
                  {mfr.systems.map((sys) => (
                    <DropdownChipButton
                      key={sys}
                      label={sys}
                      isSelected={manufacturer === mfr.manufacturer && system === sys}
                      onClick={() => handleSystemClick(mfr.manufacturer, sys)}
                    />
                  ))}
                </DropdownGroup>
              ))}
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
  const allManufacturers = useMemo(() => KNOWN_MANUFACTURERS.map((m) => m.manufacturer), []);
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
