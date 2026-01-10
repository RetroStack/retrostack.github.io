/**
 * Dropdown Trigger Component
 *
 * A 3D raised button style for dropdown triggers. Provides the
 * consistent "picker button" appearance used throughout the app.
 * Features:
 * - 3D raised appearance with gradient and shadow
 * - Cyan accent color
 * - Press-in effect on click
 * - Open state styling
 * - Proper disabled state
 *
 * @module components/ui/DropdownTrigger
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Props for DropdownTrigger component
 */
export interface DropdownTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether the dropdown is currently open (for active state styling) */
  isOpen?: boolean;
}

/**
 * Base styles for the 3D raised dropdown trigger button
 */
const BASE_STYLES = [
  // Layout
  "px-3 py-2",
  // 3D gradient background (light top, dark bottom)
  "bg-gradient-to-b from-gray-600/50 to-gray-700/50",
  // Blue border with lighter top edge for depth
  "border border-retro-cyan/50 border-t-retro-cyan/70",
  // Shadow for raised effect
  "shadow-md shadow-black/30",
  // Shape and text
  "rounded text-sm text-retro-cyan",
  // Transitions
  "transition-all",
  // Hover state (lighter)
  "hover:from-gray-500/50 hover:to-gray-600/50 hover:border-retro-cyan",
  // Active/pressed state (darker, reduced shadow)
  "active:from-gray-700/50 active:to-gray-800/50 active:shadow-sm",
  // Disabled state
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

/**
 * A 3D raised button style used for dropdown triggers.
 *
 * This component provides the consistent "picker button" appearance used
 * throughout the application for dropdown triggers like chip selectors,
 * manufacturer/system pickers, and preset dropdowns.
 *
 * Features:
 * - 3D raised appearance with gradient and shadow
 * - Cyan accent color
 * - Press-in effect on click
 * - Proper disabled state
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DropdownTrigger onClick={toggleDropdown}>
 *   ...
 * </DropdownTrigger>
 *
 * // With open state for styling feedback
 * <DropdownTrigger onClick={toggleDropdown} isOpen={isOpen}>
 *   Select Option
 * </DropdownTrigger>
 *
 * // Disabled state
 * <DropdownTrigger disabled>
 *   Not Available
 * </DropdownTrigger>
 * ```
 */
export const DropdownTrigger = forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ children, className = "", isOpen, ...props }, ref) => {
    // When open, apply the pressed/active styling
    const openStyles = isOpen ? "from-gray-700/50 to-gray-800/50 shadow-sm" : "";

    return (
      <button
        ref={ref}
        type="button"
        className={`${BASE_STYLES} ${openStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

DropdownTrigger.displayName = "DropdownTrigger";
