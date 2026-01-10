/**
 * Form Label Component
 *
 * A styled form label following the retro design system. Features:
 * - Consistent gray text color
 * - Optional required indicator (asterisk)
 * - Optional description text
 * - Configurable spacing variants
 *
 * Also exports FORM_LABEL_STYLES constant for inline usage.
 *
 * @module components/ui/FormLabel
 */
import { type LabelHTMLAttributes, type ReactNode } from "react";

/**
 * Props for FormLabel component
 */
export interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Label text content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether the field is required (shows asterisk) */
  required?: boolean;
  /** Optional description text below the label */
  description?: string;
  /** Spacing variant - affects margin bottom */
  spacing?: "tight" | "normal";
}

/**
 * Base label styles
 */
const LABEL_BASE_STYLES = "block text-sm text-gray-300";

/**
 * Spacing variants
 */
const SPACING_STYLES = {
  tight: "mb-1",
  normal: "mb-2",
};

/**
 * A styled form label component following the retro design system.
 *
 * Features:
 * - Consistent gray text color
 * - Optional required indicator
 * - Optional description text
 * - Configurable spacing
 *
 * @example
 * ```tsx
 * // Basic usage
 * <FormLabel>Username</FormLabel>
 * <input ... />
 *
 * // With required indicator
 * <FormLabel required>Email</FormLabel>
 * <input type="email" ... />
 *
 * // With description
 * <FormLabel description="Choose a unique identifier">
 *   Character Set Name
 * </FormLabel>
 *
 * // Tight spacing
 * <FormLabel spacing="tight">Width</FormLabel>
 * ```
 */
export function FormLabel({
  children,
  className = "",
  required,
  description,
  spacing = "normal",
  ...props
}: FormLabelProps) {
  return (
    <div className={SPACING_STYLES[spacing]}>
      <label className={`${LABEL_BASE_STYLES} ${className}`} {...props}>
        {children}
        {required && <span className="text-retro-pink ml-1">*</span>}
      </label>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
  );
}

/**
 * Exported label styles for inline usage
 */
export const FORM_LABEL_STYLES = LABEL_BASE_STYLES;
