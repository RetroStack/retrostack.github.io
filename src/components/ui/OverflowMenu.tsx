"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useOutsideClick } from "@/hooks/useOutsideClick";

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
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const menuRef = useOutsideClick<HTMLDivElement>(handleClose, isOpen);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: OverflowMenuItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent, item: OverflowMenuItem) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleItemClick(item);
    }
  };

  if (items.length === 0) return null;

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        className="touch-target flex items-center justify-center p-2 text-gray-400 hover:text-retro-cyan transition-colors rounded-md hover:bg-retro-purple/30"
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
          className={`absolute top-full mt-2 z-50 min-w-[180px] glass rounded-md py-1 shadow-lg shadow-retro-purple/20 ${
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
                  ? "text-gray-600 cursor-not-allowed"
                  : item.variant === "danger"
                  ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  : "text-gray-300 hover:bg-retro-purple/30 hover:text-retro-cyan"
              }
            `;

            if (item.href && !item.disabled) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={itemClasses}
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
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
