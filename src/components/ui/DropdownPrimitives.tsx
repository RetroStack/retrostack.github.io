/**
 * Dropdown Primitive Components
 *
 * Reusable building blocks for dropdown menus and pickers:
 * - DropdownPanel: Container with positioning and scroll
 * - DropdownSection/SectionHeader: Labeled sections within dropdown
 * - DropdownGroup: Grouped items with header
 * - DropdownChipButton: Chip-style selection buttons
 * - DropdownClearButton: Clear selection action
 * - Picker3DButton: 3D raised trigger button
 * - pickerInputClasses: Standard text input styles
 *
 * Used by ManufacturerSystemSelect, ChipSelect, and other picker components.
 *
 * @module components/ui/DropdownPrimitives
 */
"use client";

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from "react";

// ============================================================================
// Dropdown Panel Container
// ============================================================================

export interface DropdownPanelProps {
  /** Whether to position dropdown to the right edge */
  alignRight?: boolean;
  /** Fixed width in pixels */
  width?: number;
  /** Maximum height with scroll */
  maxHeight?: number;
  /** Whether to open upward */
  dropUp?: boolean;
  /** Children content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Container for dropdown content with consistent styling
 */
export function DropdownPanel({
  alignRight = true,
  width = 480,
  maxHeight = 320,
  dropUp = false,
  children,
  className = "",
}: DropdownPanelProps) {
  return (
    <div
      className={`absolute z-50 ${dropUp ? "bottom-full mb-1" : "top-full mt-1"} overflow-y-auto bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl ${className}`}
      style={{
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        ...(alignRight ? { right: 0 } : { left: 0 }),
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Dropdown Section Components
// ============================================================================

export interface DropdownSectionProps {
  /** Section title */
  title: string;
  /** Whether to show a top border */
  showDivider?: boolean;
  /** Children content */
  children?: ReactNode;
}

/**
 * Header for a dropdown section (cyan text)
 */
export function DropdownSectionHeader({ title, showDivider = false }: Omit<DropdownSectionProps, "children">) {
  return (
    <>
      {showDivider && <div className="border-t border-retro-grid/30" />}
      <div className="px-2 pt-2 pb-1">
        <div className="text-[10px] text-retro-cyan uppercase font-medium">{title}</div>
      </div>
    </>
  );
}

/**
 * Complete section with header and content
 */
export function DropdownSection({ title, showDivider = false, children }: DropdownSectionProps) {
  return (
    <div className={showDivider ? "border-t border-retro-grid/30" : ""}>
      <div className="p-2">
        <div className="text-[10px] text-retro-cyan uppercase font-medium mb-2">{title}</div>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Dropdown Group Components
// ============================================================================

export interface DropdownGroupProps {
  /** Group label (e.g., manufacturer name) */
  label: string;
  /** Whether the group header is clickable */
  onClick?: () => void;
  /** Whether this group is selected */
  isSelected?: boolean;
  /** Children (buttons) */
  children: ReactNode;
}

/**
 * Group component within a dropdown section (cyan header with indented items)
 */
export function DropdownGroup({ label, onClick, isSelected = false, children }: DropdownGroupProps) {
  const HeaderElement = onClick ? "button" : "div";
  const headerClasses = onClick
    ? `w-full text-left px-2 py-1 text-xs font-medium rounded transition-all ${
        isSelected
          ? "text-retro-cyan bg-retro-cyan/30 ring-1 ring-retro-cyan"
          : "text-retro-cyan bg-retro-cyan/10 hover:bg-retro-cyan/20 hover:text-white"
      }`
    : "w-full text-left px-2 py-1 text-xs font-medium text-retro-cyan bg-retro-cyan/10 rounded";

  return (
    <div className="mb-3 last:mb-0">
      <HeaderElement onClick={onClick} className={headerClasses}>
        {label}
      </HeaderElement>
      <div className="ml-3 mt-1 flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

// ============================================================================
// Dropdown Button Components
// ============================================================================

export interface DropdownChipButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Button label */
  label: string;
  /** Whether the button is selected */
  isSelected?: boolean;
  /** Color variant */
  variant?: "amber" | "pink" | "cyan";
}

/**
 * Chip-style button for dropdown items
 */
export function DropdownChipButton({
  label,
  isSelected = false,
  variant = "amber",
  className = "",
  ...props
}: DropdownChipButtonProps) {
  const variantStyles = {
    amber: isSelected
      ? "bg-retro-amber/40 text-retro-amber ring-1 ring-retro-amber"
      : "bg-retro-amber/15 text-retro-amber hover:bg-retro-amber/30 hover:text-white",
    pink: isSelected
      ? "bg-retro-pink/40 text-retro-pink ring-1 ring-retro-pink"
      : "bg-retro-pink/15 text-retro-pink hover:bg-retro-pink/30 hover:text-white",
    cyan: isSelected
      ? "bg-retro-cyan/40 text-retro-cyan ring-1 ring-retro-cyan"
      : "bg-retro-cyan/15 text-retro-cyan hover:bg-retro-cyan/30 hover:text-white",
  };

  return (
    <button
      type="button"
      className={`px-2 py-0.5 text-xs rounded transition-all disabled:opacity-50 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}

export interface DropdownClearButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Button text */
  label?: string;
}

/**
 * Clear selection button for dropdown
 */
export function DropdownClearButton({ onClick, label = "Clear selection" }: DropdownClearButtonProps) {
  return (
    <div className="p-2 border-b border-retro-grid/30">
      <button
        onClick={onClick}
        className="w-full text-left px-2 py-1 text-xs text-retro-pink hover:text-white hover:bg-retro-grid/20 rounded transition-colors"
      >
        {label}
      </button>
    </div>
  );
}

// ============================================================================
// 3D Trigger Button
// ============================================================================

export interface Picker3DButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Button content - defaults to "..." */
  children?: ReactNode;
}

/**
 * 3D raised button typically used as dropdown trigger
 */
export const Picker3DButton = forwardRef<HTMLButtonElement, Picker3DButtonProps>(function Picker3DButton(
  { children = "...", className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`px-3 py-2 bg-gradient-to-b from-gray-600/50 to-gray-700/50 border border-retro-cyan/50 border-t-retro-cyan/70 hover:from-gray-500/50 hover:to-gray-600/50 hover:border-retro-cyan active:from-gray-700/50 active:to-gray-800/50 shadow-md shadow-black/30 active:shadow-sm rounded text-sm text-retro-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Picker3DButton.displayName = "Picker3DButton";

// ============================================================================
// Text Input Styling
// ============================================================================

/**
 * Standard text input classes for picker components
 */
export const pickerInputClasses =
  "flex-1 min-w-0 px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan disabled:opacity-50 disabled:cursor-not-allowed";
