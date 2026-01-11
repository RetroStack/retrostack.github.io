/**
 * Single-Select Dropdown Component
 *
 * A dropdown component for single selection with consistent styling.
 * Features:
 * - Single selection from a list of options
 * - Full-text search to filter options
 * - Options sorted alphabetically
 * - Consistent styling with MultiSelectDropdown
 * - Generic type support for string or number values
 * - Click-outside to close via useDropdown hook
 *
 * @module components/ui/SingleSelectDropdown
 */
"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropdown } from "@/hooks/useDropdown";

export interface SingleSelectDropdownProps<T extends string | number> {
  /** Available options */
  options: { value: T; label: string }[];
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Placeholder when nothing selected (optional) */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the dropdown */
  ariaLabel?: string;
  /** Sort options numerically instead of alphabetically */
  numericSort?: boolean;
}

/**
 * Single-select dropdown with consistent filter styling
 */
export function SingleSelectDropdown<T extends string | number>({
  options,
  value,
  onChange,
  placeholder,
  className = "",
  ariaLabel,
  numericSort = false,
}: SingleSelectDropdownProps<T>) {
  const { ref: dropdownRef, isOpen, toggle, close } = useDropdown<HTMLDivElement>();
  const [searchQuery, setSearchQuery] = useState("");

  // Wrapper for toggle that clears search when opening
  const handleToggle = useCallback(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
    toggle();
  }, [isOpen, toggle]);

  const handleSelect = useCallback(
    (selectedValue: T) => {
      onChange(selectedValue);
      close();
      setSearchQuery("");
    },
    [onChange, close]
  );

  // Sort options and filter by search query
  const filteredOptions = useMemo(() => {
    const sorted = [...options].sort((a, b) => {
      if (numericSort) {
        const numA = parseFloat(a.label);
        const numB = parseFloat(b.label);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
      }
      return a.label.localeCompare(b.label);
    });

    if (!searchQuery.trim()) {
      return sorted;
    }

    const query = searchQuery.toLowerCase().trim();
    return sorted.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, searchQuery, numericSort]);

  const selectedOption = options.find((o) => o.value === value);
  const displayText = selectedOption?.label ?? placeholder ?? "";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`
          flex items-center justify-between gap-2 w-full px-3 py-1.5
          bg-retro-navy/50 border rounded text-sm text-left
          transition-colors
          ${isOpen
            ? "border-retro-cyan"
            : "border-retro-grid/50 hover:border-retro-grid"
          }
          ${selectedOption ? "text-gray-200" : "text-gray-400"}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
      >
        <span className="truncate">{displayText}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl overflow-hidden"
          role="listbox"
        >
          {/* Search input - sticky at top */}
          <div className="sticky top-0 z-10 p-2 border-b border-retro-grid/30 bg-retro-navy">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full px-3 py-1.5 text-sm bg-retro-dark border border-retro-grid/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
            />
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                    transition-colors
                    ${isSelected
                      ? "bg-retro-cyan/10 text-retro-cyan"
                      : "text-gray-300 hover:bg-retro-purple/20"
                    }
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Checkmark for selected item */}
                  <span className="w-4 h-4 flex items-center justify-center">
                    {isSelected && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                  </span>
                  {option.label}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                {searchQuery ? "No matches found" : "No options available"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
