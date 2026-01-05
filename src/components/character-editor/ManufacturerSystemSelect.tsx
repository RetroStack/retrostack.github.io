"use client";

import { useState, useMemo, useCallback } from "react";
import { KNOWN_MANUFACTURERS, getSystemsForManufacturer } from "@/lib/character-editor";

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
 * Paired dropdown selects for manufacturer and system
 * Supports both known manufacturers/systems and custom values
 */
export function ManufacturerSystemSelect({
  manufacturer,
  system,
  onManufacturerChange,
  onSystemChange,
  disabled = false,
  className = "",
}: ManufacturerSystemSelectProps) {
  const [showCustomManufacturer, setShowCustomManufacturer] = useState(false);
  const [showCustomSystem, setShowCustomSystem] = useState(false);
  const [customManufacturerInput, setCustomManufacturerInput] = useState("");
  const [customSystemInput, setCustomSystemInput] = useState("");

  // Get all known manufacturers
  const allManufacturers = useMemo(() => KNOWN_MANUFACTURERS.map((m) => m.manufacturer), []);

  // Get systems for the selected manufacturer
  const availableSystems = useMemo(() => {
    if (!manufacturer) return [];
    return getSystemsForManufacturer(manufacturer);
  }, [manufacturer]);

  // Check if current manufacturer is custom (not in known list)
  const isCustomManufacturer = manufacturer && !allManufacturers.includes(manufacturer);

  // Check if current system is custom (not in available systems for this manufacturer)
  const isCustomSystem = system && !availableSystems.includes(system);

  // Handle manufacturer select change
  const handleManufacturerSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === "__custom__") {
        setShowCustomManufacturer(true);
        setCustomManufacturerInput("");
      } else {
        onManufacturerChange(value);
        // Reset system when manufacturer changes
        onSystemChange("");
        setShowCustomManufacturer(false);
      }
    },
    [onManufacturerChange, onSystemChange]
  );

  // Handle custom manufacturer submit
  const handleCustomManufacturerSubmit = useCallback(() => {
    if (customManufacturerInput.trim()) {
      onManufacturerChange(customManufacturerInput.trim());
      onSystemChange("");
      setShowCustomManufacturer(false);
      setCustomManufacturerInput("");
    }
  }, [customManufacturerInput, onManufacturerChange, onSystemChange]);

  // Handle custom manufacturer cancel
  const handleCustomManufacturerCancel = useCallback(() => {
    setShowCustomManufacturer(false);
    setCustomManufacturerInput("");
  }, []);

  // Handle system select change
  const handleSystemSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === "__custom__") {
        setShowCustomSystem(true);
        setCustomSystemInput("");
      } else {
        onSystemChange(value);
        setShowCustomSystem(false);
      }
    },
    [onSystemChange]
  );

  // Handle custom system submit
  const handleCustomSystemSubmit = useCallback(() => {
    if (customSystemInput.trim()) {
      onSystemChange(customSystemInput.trim());
      setShowCustomSystem(false);
      setCustomSystemInput("");
    }
  }, [customSystemInput, onSystemChange]);

  // Handle custom system cancel
  const handleCustomSystemCancel = useCallback(() => {
    setShowCustomSystem(false);
    setCustomSystemInput("");
  }, []);

  // Handle key press for custom inputs
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent, submitFn: () => void) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitFn();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (showCustomManufacturer) handleCustomManufacturerCancel();
        if (showCustomSystem) handleCustomSystemCancel();
      }
    },
    [showCustomManufacturer, showCustomSystem, handleCustomManufacturerCancel, handleCustomSystemCancel]
  );

  const selectClasses = `
    w-full px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg
    text-sm text-gray-200 focus:outline-none focus:border-retro-cyan/50
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const inputClasses = `
    flex-1 px-3 py-2 bg-retro-navy/50 border border-retro-grid/50 rounded-lg
    text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-retro-cyan/50
    transition-colors
  `;

  const buttonClasses = `
    px-3 py-2 text-sm rounded-lg transition-colors
  `;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Manufacturer field */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Manufacturer
        </label>

        {showCustomManufacturer ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={customManufacturerInput}
              onChange={(e) => setCustomManufacturerInput(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, handleCustomManufacturerSubmit)}
              placeholder="Enter manufacturer name..."
              className={inputClasses}
              autoFocus
              disabled={disabled}
            />
            <button
              onClick={handleCustomManufacturerSubmit}
              disabled={disabled || !customManufacturerInput.trim()}
              className={`${buttonClasses} bg-retro-cyan/20 text-retro-cyan hover:bg-retro-cyan/30 disabled:opacity-50`}
            >
              Add
            </button>
            <button
              onClick={handleCustomManufacturerCancel}
              disabled={disabled}
              className={`${buttonClasses} bg-retro-grid/20 text-gray-400 hover:bg-retro-grid/30`}
            >
              Cancel
            </button>
          </div>
        ) : (
          <select
            value={isCustomManufacturer ? "" : manufacturer}
            onChange={handleManufacturerSelectChange}
            disabled={disabled}
            className={selectClasses}
          >
            <option value="">Select manufacturer...</option>
            {allManufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value="__custom__">Other (custom)...</option>
            {isCustomManufacturer && (
              <option value={manufacturer} disabled>
                {manufacturer} (custom)
              </option>
            )}
          </select>
        )}

        {isCustomManufacturer && !showCustomManufacturer && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Custom: <span className="text-retro-cyan">{manufacturer}</span>
            </span>
            <button
              onClick={() => {
                onManufacturerChange("");
                onSystemChange("");
              }}
              className="text-xs text-gray-500 hover:text-retro-pink"
              disabled={disabled}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* System field */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          System
        </label>

        {showCustomSystem ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={customSystemInput}
              onChange={(e) => setCustomSystemInput(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, handleCustomSystemSubmit)}
              placeholder="Enter system name..."
              className={inputClasses}
              autoFocus
              disabled={disabled}
            />
            <button
              onClick={handleCustomSystemSubmit}
              disabled={disabled || !customSystemInput.trim()}
              className={`${buttonClasses} bg-retro-cyan/20 text-retro-cyan hover:bg-retro-cyan/30 disabled:opacity-50`}
            >
              Add
            </button>
            <button
              onClick={handleCustomSystemCancel}
              disabled={disabled}
              className={`${buttonClasses} bg-retro-grid/20 text-gray-400 hover:bg-retro-grid/30`}
            >
              Cancel
            </button>
          </div>
        ) : (
          <select
            value={isCustomSystem ? "" : system}
            onChange={handleSystemSelectChange}
            disabled={disabled || !manufacturer}
            className={selectClasses}
          >
            <option value="">
              {manufacturer ? "Select system..." : "Select a manufacturer first..."}
            </option>
            {availableSystems.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {manufacturer && <option value="__custom__">Other (custom)...</option>}
            {isCustomSystem && (
              <option value={system} disabled>
                {system} (custom)
              </option>
            )}
          </select>
        )}

        {isCustomSystem && !showCustomSystem && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Custom: <span className="text-retro-cyan">{system}</span>
            </span>
            <button
              onClick={() => onSystemChange("")}
              className="text-xs text-gray-500 hover:text-retro-pink"
              disabled={disabled}
            >
              Clear
            </button>
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
