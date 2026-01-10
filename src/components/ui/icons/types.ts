/**
 * Icon Types and Utilities
 *
 * Shared types and helper functions for the icon component system.
 * Provides consistent sizing and styling across all icon components.
 *
 * Exports:
 * - IconProps: Base interface extending SVGProps with size option
 * - ICON_SIZE_CLASSES: Tailwind class mappings for sm/md/lg/xl sizes
 * - DEFAULT_ICON_CLASS: Default size (medium, w-5 h-5)
 * - getIconClass: Helper to resolve size prop or className to CSS class
 *
 * @module components/ui/icons/types
 */
import { SVGProps } from "react";

/**
 * Common props for all icon components
 */
export interface IconProps extends SVGProps<SVGSVGElement> {
  /** CSS class name for custom styling */
  className?: string;
  /** Icon size - uses Tailwind classes or custom dimensions */
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Size mappings for Tailwind classes
 */
export const ICON_SIZE_CLASSES: Record<NonNullable<IconProps["size"]>, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

/**
 * Default icon class (medium size)
 */
export const DEFAULT_ICON_CLASS = "w-5 h-5";

/**
 * Get the appropriate class for an icon based on size prop or className override
 */
export function getIconClass(size?: IconProps["size"], className?: string): string {
  if (className) return className;
  if (size) return ICON_SIZE_CLASSES[size];
  return DEFAULT_ICON_CLASS;
}
