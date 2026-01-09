"use client";
/* eslint-disable react-hooks/set-state-in-effect -- DOM measurement requires effect */

import { useRef, useState, useEffect, useCallback } from "react";
import { OverflowMenu, OverflowMenuItem } from "./OverflowMenu";
import { Tooltip } from "./Tooltip";

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  /** Priority level (higher = stays visible longer). Default is 1.
   * Suggested values: 3 = essential, 2 = important, 1 = normal, 0 = low priority */
  priority?: number;
  /** Tooltip description shown on hover */
  tooltip?: string;
  /** Keyboard shortcut displayed in tooltip */
  shortcut?: string;
  /** Active state color variant. Default is "cyan" */
  activeVariant?: "cyan" | "amber";
}

export interface ToolbarSeparator {
  type: "separator";
  id: string;
}

export type ToolbarItem = ToolbarAction | ToolbarSeparator;

function isSeparator(item: ToolbarItem): item is ToolbarSeparator {
  return "type" in item && item.type === "separator";
}

interface ResponsiveToolbarProps {
  actions: ToolbarItem[];
  minVisibleItems?: number;
  className?: string;
  sticky?: boolean;
}

const ITEM_WIDTH = 48; // Width of icon-only button (touch target with larger icon)
const SEPARATOR_WIDTH = 16; // Width of separator element
const OVERFLOW_BUTTON_WIDTH = 48;
const TOOLBAR_PADDING = 32; // Padding for collapse calculation

export function ResponsiveToolbar({
  actions,
  minVisibleItems = 2,
  className = "",
  sticky = false,
}: ResponsiveToolbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const calculateVisibleItems = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const availableWidth = containerWidth - TOOLBAR_PADDING - OVERFLOW_BUTTON_WIDTH;

    // Get all action items with their priorities (exclude separators for priority sorting)
    const actionItems = actions
      .filter((item): item is ToolbarAction => !isSeparator(item))
      .map((item) => ({
        item,
        priority: item.priority ?? 1,
      }));

    // Sort by priority (lowest first - these get hidden first)
    const sortedByPriority = [...actionItems].sort((a, b) => a.priority - b.priority);

    // Calculate total width needed for all items
    let totalWidth = 0;
    for (const item of actions) {
      totalWidth += isSeparator(item) ? SEPARATOR_WIDTH : ITEM_WIDTH;
    }

    // Progressively hide items starting from lowest priority until we fit
    const newHiddenIds = new Set<string>();
    let currentWidth = totalWidth;
    let visibleActionCount = actionItems.length;

    for (const { item } of sortedByPriority) {
      if (currentWidth <= availableWidth) break;
      if (visibleActionCount <= minVisibleItems) break;

      newHiddenIds.add(item.id);
      currentWidth -= ITEM_WIDTH;
      visibleActionCount--;
    }

    setHiddenIds(newHiddenIds);
  }, [actions, minVisibleItems]);

  useEffect(() => {
    // Initial calculation and resize observer for responsive toolbar
    calculateVisibleItems();

    const observer = new ResizeObserver(() => {
      calculateVisibleItems();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [calculateVisibleItems]);

  // Filter visible and overflow items while maintaining original order
  const visibleActions: ToolbarItem[] = [];
  const overflowActions: ToolbarAction[] = [];

  for (const item of actions) {
    if (isSeparator(item)) {
      // Include separator only if there are visible items after it
      const remainingItems = actions.slice(actions.indexOf(item) + 1);
      const hasVisibleAfter = remainingItems.some(
        (i) => !isSeparator(i) && !hiddenIds.has(i.id)
      );
      // Also check if there are visible items before it
      const previousItems = actions.slice(0, actions.indexOf(item));
      const hasVisibleBefore = previousItems.some(
        (i) => !isSeparator(i) && !hiddenIds.has(i.id)
      );
      if (hasVisibleAfter && hasVisibleBefore) {
        visibleActions.push(item);
      }
    } else if (hiddenIds.has(item.id)) {
      overflowActions.push(item);
    } else {
      visibleActions.push(item);
    }
  }

  // Sort overflow items by their original order for consistent menu
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
      <div className="flex items-center gap-1 sm:gap-2 flex-nowrap overflow-hidden">
        {visibleActions.map((item) =>
          isSeparator(item) ? (
            <div
              key={item.id}
              className="h-6 w-px bg-retro-grid/50 mx-1"
              aria-hidden="true"
            />
          ) : (
            <Tooltip
              key={item.id}
              content={item.tooltip || item.label}
              shortcut={item.shortcut}
              position="bottom"
            >
              <button
                onClick={item.onClick}
                disabled={item.disabled}
                aria-label={item.label}
                className={`
                  touch-target flex items-center justify-center p-2 rounded-md
                  text-sm font-ui transition-colors flex-shrink-0
                  ${
                    item.disabled
                      ? "text-gray-600 cursor-not-allowed"
                      : item.active
                      ? item.activeVariant === "amber"
                        ? "text-retro-amber bg-retro-amber/20"
                        : "text-retro-cyan bg-retro-purple/40"
                      : "text-gray-300 hover:text-retro-cyan hover:bg-retro-purple/30"
                  }
                `}
              >
                <span className="w-6 h-6 flex-shrink-0 [&>svg]:w-full [&>svg]:h-full">{item.icon}</span>
              </button>
            </Tooltip>
          )
        )}
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
