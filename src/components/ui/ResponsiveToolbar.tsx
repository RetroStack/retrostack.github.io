"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { OverflowMenu, OverflowMenuItem } from "./OverflowMenu";

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
}

interface ResponsiveToolbarProps {
  actions: ToolbarAction[];
  minVisibleItems?: number;
  className?: string;
  sticky?: boolean;
}

const ITEM_WIDTH = 80; // Approximate width of each action button in pixels
const OVERFLOW_BUTTON_WIDTH = 48;
const TOOLBAR_PADDING = 16;

export function ResponsiveToolbar({
  actions,
  minVisibleItems = 2,
  className = "",
  sticky = false,
}: ResponsiveToolbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(actions.length);

  const calculateVisibleItems = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const availableWidth = containerWidth - TOOLBAR_PADDING - OVERFLOW_BUTTON_WIDTH;
    const maxItems = Math.floor(availableWidth / ITEM_WIDTH);

    // Clamp between minVisibleItems and total actions
    const newVisibleCount = Math.max(
      minVisibleItems,
      Math.min(maxItems, actions.length)
    );

    setVisibleCount(newVisibleCount);
  }, [actions.length, minVisibleItems]);

  useEffect(() => {
    calculateVisibleItems();

    const observer = new ResizeObserver(() => {
      calculateVisibleItems();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [calculateVisibleItems]);

  const visibleActions = actions.slice(0, visibleCount);
  const overflowActions = actions.slice(visibleCount);

  const overflowItems: OverflowMenuItem[] = overflowActions.map((action) => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    onClick: action.onClick,
    disabled: action.disabled,
  }));

  return (
    <div
      ref={containerRef}
      className={`
        flex items-center justify-between
        bg-retro-navy/80 backdrop-blur-sm
        border-b border-retro-grid/50
        px-2 sm:px-4
        ${sticky ? "sticky top-[var(--header-height)] z-40" : ""}
        ${className}
      `}
      style={{ minHeight: "var(--toolbar-height)" }}
    >
      {/* Visible Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {visibleActions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              touch-target flex items-center gap-2 px-2 sm:px-3 py-2 rounded-md
              text-sm font-ui transition-colors
              ${
                action.disabled
                  ? "text-gray-600 cursor-not-allowed"
                  : action.active
                  ? "text-retro-cyan bg-retro-purple/40"
                  : "text-gray-300 hover:text-retro-cyan hover:bg-retro-purple/30"
              }
            `}
            title={action.label}
          >
            <span className="w-5 h-5 flex-shrink-0">{action.icon}</span>
            {!action.hideLabel && (
              <span className="hidden sm:inline">{action.label}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overflow Menu */}
      {overflowItems.length > 0 && (
        <OverflowMenu
          items={overflowItems}
          align="right"
          label="More actions"
        />
      )}
    </div>
  );
}
