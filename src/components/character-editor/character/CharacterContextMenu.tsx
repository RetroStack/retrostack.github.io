/**
 * Character Context Menu
 *
 * A right-click context menu for character actions in the editor.
 * Features:
 * - Positioned at click location with viewport bounds checking
 * - Keyboard shortcut display
 * - Danger variant for destructive actions
 * - Divider support for grouping
 * - Close on Escape or click outside
 *
 * Also exports useContextMenu hook for state management.
 *
 * @module components/character-editor/character/CharacterContextMenu
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ContextMenuItem {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface CharacterContextMenuProps {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Menu items */
  items: ContextMenuItem[];
  /** Callback when menu is closed */
  onClose: () => void;
}

/**
 * Context menu component for character actions
 */
export function CharacterContextMenu({
  x,
  y,
  items,
  onClose,
}: CharacterContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position
    if (rect.right > viewportWidth - 8) {
      menuRef.current.style.left = `${viewportWidth - rect.width - 8}px`;
    }

    // Adjust vertical position
    if (rect.bottom > viewportHeight - 8) {
      menuRef.current.style.top = `${viewportHeight - rect.height - 8}px`;
    }
  }, [x, y]);

  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (!item.disabled) {
        item.onClick();
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[160px] py-1 bg-retro-navy/95 backdrop-blur-sm border border-retro-grid/50 rounded-lg shadow-xl"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={index}
              className="h-px bg-retro-grid/30 my-1"
            />
          );
        }

        return (
          <button
            key={index}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`
              w-full px-3 py-1.5 text-left text-sm flex items-center justify-between gap-4
              transition-colors
              ${item.disabled
                ? "text-gray-600 cursor-not-allowed"
                : item.danger
                ? "text-red-400 hover:bg-red-500/20"
                : "text-gray-200 hover:bg-retro-cyan/20 hover:text-retro-cyan"
              }
            `}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-gray-500 font-mono">
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Hook for managing context menu state
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    index: number;
  } | null>(null);

  const showContextMenu = useCallback((x: number, y: number, index: number) => {
    setContextMenu({ x, y, index });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
}
