/**
 * Selection Mode Bar Component
 *
 * A floating action bar for multi-selection mode on touch devices.
 * Appears at the bottom of the screen when selection mode is active.
 * Features:
 * - Selection count badge
 * - All/None bulk selection buttons
 * - Custom action buttons (e.g., delete, copy)
 * - Done button to exit selection mode
 * - Slide-up animation
 * - Safe area inset support for mobile
 *
 * @module components/ui/SelectionModeBar
 */
"use client";

import { ReactNode } from "react";

export interface SelectionModeAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label */
  label: string;
  /** Icon element */
  icon?: ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Whether the action is disabled */
  disabled?: boolean;
  /** Variant for styling */
  variant?: "default" | "danger";
}

export interface SelectionModeBarProps {
  /** Whether the bar is visible */
  isVisible: boolean;
  /** Number of selected items */
  selectionCount: number;
  /** Total number of items */
  totalItems: number;
  /** Handler for select all */
  onSelectAll: () => void;
  /** Handler for clear selection */
  onClearSelection: () => void;
  /** Handler for exiting selection mode */
  onExitMode: () => void;
  /** Additional action buttons */
  actions?: SelectionModeAction[];
  /** Whether to use fixed positioning (stays at bottom of screen) */
  fixed?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Floating action bar displayed when selection mode is active.
 *
 * Shows selection count, bulk actions (All/None), custom actions,
 * and a Done button to exit selection mode.
 *
 * @example
 * ```tsx
 * <SelectionModeBar
 *   isVisible={isSelectionMode}
 *   selectionCount={3}
 *   totalItems={128}
 *   onSelectAll={selectAll}
 *   onClearSelection={clearSelection}
 *   onExitMode={exitSelectionMode}
 *   actions={[
 *     { id: "delete", label: "Delete", onClick: handleDelete, variant: "danger" }
 *   ]}
 * />
 * ```
 */
export function SelectionModeBar({
  isVisible,
  selectionCount,
  totalItems,
  onSelectAll,
  onClearSelection,
  onExitMode,
  actions = [],
  fixed = false,
  className = "",
}: SelectionModeBarProps) {
  if (!isVisible) return null;

  const allSelected = selectionCount >= totalItems;

  return (
    <div
      className={`
        ${fixed ? "sticky" : "absolute"} bottom-0 left-0 right-0
        bg-retro-navy/95 backdrop-blur-sm
        border-t border-retro-cyan/50
        px-3 py-2
        flex items-center justify-between gap-2
        animate-slide-up
        safe-bottom
        z-10
        ${className}
      `}
      role="toolbar"
      aria-label="Selection actions"
    >
      {/* Left side: Selection count and bulk actions */}
      <div className="flex items-center gap-3">
        {/* Selection count badge */}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-retro-cyan/20 text-retro-cyan text-sm font-medium">
            {selectionCount}
          </span>
          <span className="text-xs text-gray-400">selected</span>
        </div>

        {/* Bulk selection buttons */}
        <div className="flex items-center gap-1 border-l border-retro-grid/30 pl-3">
          <button
            onClick={onSelectAll}
            disabled={allSelected}
            className="px-2 py-1 text-xs text-gray-400 hover:text-retro-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            All
          </button>
          <button
            onClick={onClearSelection}
            disabled={selectionCount <= 1}
            className="px-2 py-1 text-xs text-gray-400 hover:text-retro-pink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            None
          </button>
        </div>
      </div>

      {/* Right side: Custom actions and Done button */}
      <div className="flex items-center gap-2">
        {/* Custom action buttons */}
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                action.variant === "danger"
                  ? "text-retro-pink hover:bg-retro-pink/20"
                  : "text-gray-300 hover:bg-retro-grid/30"
              }
            `}
            title={action.label}
          >
            {action.icon && <span className="w-4 h-4">{action.icon}</span>}
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
