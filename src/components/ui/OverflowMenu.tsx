/**
 * Overflow Menu Component
 *
 * A dropdown menu triggered by a three-dot button, commonly used for
 * additional actions that don't fit in the main UI. Features:
 * - Default three-dot trigger or custom trigger element
 * - Support for links and buttons
 * - Danger variant for destructive actions
 * - Left or right alignment
 * - Keyboard navigation support
 * - Click-outside to close
 *
 * @module components/ui/OverflowMenu
 */
"use client";

import Link from "next/link";
import { useDropdown } from "@/hooks/useDropdown";

export interface OverflowMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: "default" | "danger";
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  trigger?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  label?: string;
}

export function OverflowMenu({
  items,
  trigger,
  align = "right",
  className = "",
  label = "More options",
}: OverflowMenuProps) {
  const { ref: dropdownRef, isOpen, toggle, close } = useDropdown<HTMLDivElement>();

  const handleItemClick = (item: OverflowMenuItem) => {
    if (item.disabled) return;
    item.onClick?.();
    close();
  };

  const handleKeyDown = (event: React.KeyboardEvent, item: OverflowMenuItem) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleItemClick(item);
    }
  };

  if (items.length === 0) return null;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={toggle}
        className="touch-target flex items-center justify-center p-2 text-gray-400 hover:text-white bg-retro-dark/50 hover:bg-retro-dark rounded-md transition-colors"
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {trigger || (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 min-w-[180px] bg-retro-navy/95 backdrop-blur-md border border-retro-grid/50 rounded-lg py-1 shadow-xl shadow-black/50 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item) => {
            const itemClasses = `
              w-full flex items-center gap-3 px-4 py-3 text-sm text-left
              transition-colors touch-target
              ${
                item.disabled
                  ? "text-gray-500 cursor-not-allowed"
                  : item.variant === "danger"
                  ? "text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  : "text-gray-200 hover:bg-retro-purple/40 hover:text-retro-cyan"
              }
            `;

            if (item.href && !item.disabled) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={itemClasses}
                  role="menuitem"
                  onClick={close}
                >
                  {item.icon && (
                    <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                className={itemClasses}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => handleKeyDown(e, item)}
              >
                {item.icon && (
                  <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
