"use client";

import { useState, useRef, useCallback } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";

export interface MultiSelectDropdownProps<T extends string | number> {
  /** Label for the dropdown */
  label: string;
  /** Available options */
  options: { value: T; label: string }[];
  /** Currently selected values */
  selected: T[];
  /** Callback when selection changes */
  onChange: (selected: T[]) => void;
  /** Placeholder when nothing selected */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show "All" option that clears selection */
  showAllOption?: boolean;
  /** Label for "All" option */
  allOptionLabel?: string;
}

/**
 * Multi-select dropdown with checkboxes
 * Selected items shown as chips/tags
 */
export function MultiSelectDropdown<T extends string | number>({
  label,
  options,
  selected,
  onChange,
  placeholder = "All",
  className = "",
  showAllOption = true,
  allOptionLabel = "All",
}: MultiSelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useOutsideClick<HTMLDivElement>(() => setIsOpen(false), isOpen);

  const toggleOption = useCallback(
    (value: T) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [selected, onChange]
  );

  const clearSelection = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const removeItem = useCallback(
    (value: T, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(selected.filter((v) => v !== value));
    },
    [selected, onChange]
  );

  const getLabel = (value: T): string => {
    const option = options.find((o) => o.value === value);
    return option?.label ?? String(value);
  };

  const hasSelection = selected.length > 0;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 w-full px-3 py-1.5
          bg-retro-dark border rounded text-sm text-left
          transition-colors
          ${isOpen
            ? "border-retro-cyan"
            : "border-retro-grid/50 hover:border-retro-grid"
          }
          ${hasSelection ? "text-white" : "text-gray-400"}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">
          {hasSelection ? `${label} (${selected.length})` : placeholder}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Selected chips */}
      {hasSelection && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selected.map((value) => (
            <span
              key={String(value)}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-retro-cyan/20 text-retro-cyan rounded text-xs"
            >
              {getLabel(value)}
              <button
                type="button"
                onClick={(e) => removeItem(value, e)}
                className="hover:text-white transition-colors"
                aria-label={`Remove ${getLabel(value)}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {/* All option */}
            {showAllOption && (
              <>
                <button
                  type="button"
                  onClick={clearSelection}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                    transition-colors
                    ${!hasSelection
                      ? "bg-retro-cyan/10 text-retro-cyan"
                      : "text-gray-300 hover:bg-retro-purple/20"
                    }
                  `}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    {!hasSelection && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                  </span>
                  {allOptionLabel}
                </button>
                <div className="h-px bg-retro-grid/30 mx-2 my-1" />
              </>
            )}

            {/* Options */}
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => toggleOption(option.value)}
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
                  {/* Checkbox */}
                  <span
                    className={`
                      w-4 h-4 flex items-center justify-center rounded border
                      ${isSelected
                        ? "bg-retro-cyan border-retro-cyan"
                        : "border-gray-500"
                      }
                    `}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-retro-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {option.label}
                </button>
              );
            })}

            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
