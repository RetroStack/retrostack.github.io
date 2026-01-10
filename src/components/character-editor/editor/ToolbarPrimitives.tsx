/**
 * Toolbar Primitives
 *
 * Low-level building blocks for editor toolbars.
 * Components:
 * - ToolbarButton: Icon button with tooltip and optional preview
 * - ToolbarDivider: Vertical separator between button groups
 *
 * These primitives are used by TransformToolbar and other
 * toolbar components for consistent styling.
 *
 * @module components/character-editor/editor/ToolbarPrimitives
 */
"use client";

import { ReactNode } from "react";
import { Tooltip } from "@/components/ui/Tooltip";

/**
 * Toolbar button component with tooltip (supports preview content)
 */
export function ToolbarButton({
  onClick,
  disabled,
  tooltip,
  shortcut,
  previewContent,
  children,
  className = "",
}: {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  shortcut?: string;
  previewContent?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  // Use preview content if available, otherwise simple tooltip
  const tooltipContent = previewContent || tooltip;

  return (
    <Tooltip content={tooltipContent} shortcut={previewContent ? undefined : shortcut} position="left">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          p-2.5 rounded transition-colors touch-target
          ${disabled
            ? "text-gray-600 cursor-not-allowed"
            : "text-gray-400 hover:text-retro-cyan hover:bg-retro-purple/30"
          }
          ${className}
        `}
      >
        {children}
      </button>
    </Tooltip>
  );
}

/**
 * Section divider component for toolbars
 */
export function ToolbarDivider() {
  return <div className="w-full h-px bg-retro-grid/30 my-1" />;
}

/**
 * Section label component for toolbars
 */
export function ToolbarLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] text-gray-500 uppercase tracking-wider text-center mb-1">
      {children}
    </div>
  );
}
