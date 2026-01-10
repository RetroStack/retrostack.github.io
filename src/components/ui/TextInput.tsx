/**
 * Text Input Component
 *
 * A styled text input following the retro design system. Features:
 * - Dark background with cyan focus border
 * - Optional label and helper text
 * - Error state with red styling
 * - Start/end adornments for icons
 * - forwardRef for form integration
 *
 * Also exports TEXT_INPUT_STYLES constant for custom use cases.
 *
 * @module components/ui/TextInput
 */
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

/**
 * Props for TextInput component
 */
export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional label displayed above the input */
  label?: string;
  /** Optional helper text displayed below the input */
  helperText?: string;
  /** Error message - when present, shows error styling */
  error?: string;
  /** Additional CSS classes for the input element */
  className?: string;
  /** Additional CSS classes for the wrapper div */
  wrapperClassName?: string;
  /** Icon or element to display at the start of the input */
  startAdornment?: ReactNode;
  /** Icon or element to display at the end of the input */
  endAdornment?: ReactNode;
}

/**
 * Base styles for text inputs
 */
const INPUT_BASE_STYLES = [
  "w-full",
  "px-3 py-2",
  "bg-retro-dark",
  "border border-retro-grid/50",
  "rounded",
  "text-sm text-white",
  "placeholder-gray-500",
  "focus:outline-none focus:border-retro-cyan",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

/**
 * Error state styles
 */
const INPUT_ERROR_STYLES = "border-red-500 focus:border-red-400";

/**
 * Label styles
 */
const LABEL_STYLES = "block text-sm text-gray-300 mb-1";

/**
 * Helper/error text styles
 */
const HELPER_STYLES = "text-xs text-gray-500 mt-1";
const ERROR_TEXT_STYLES = "text-xs text-red-400 mt-1";

/**
 * A styled text input component following the retro design system.
 *
 * Features:
 * - Dark background with cyan focus border
 * - Optional label
 * - Optional helper text
 * - Error state with red styling
 * - Start/end adornments for icons or buttons
 * - Forwards ref for form integration
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TextInput
 *   placeholder="Enter text..."
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 *
 * // With label
 * <TextInput
 *   label="Username"
 *   placeholder="Enter username"
 * />
 *
 * // With error
 * <TextInput
 *   label="Email"
 *   error="Invalid email address"
 * />
 *
 * // With helper text
 * <TextInput
 *   label="Character Index"
 *   placeholder="e.g. 65, 0x41"
 *   helperText="Enter decimal (65) or hex (0x41, $41)"
 * />
 * ```
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      helperText,
      error,
      className = "",
      wrapperClassName = "",
      startAdornment,
      endAdornment,
      ...props
    },
    ref,
  ) => {
    const inputStyles = `${INPUT_BASE_STYLES} ${error ? INPUT_ERROR_STYLES : ""} ${className}`;
    const hasAdornment = startAdornment || endAdornment;

    const inputElement = (
      <input
        ref={ref}
        className={hasAdornment ? `${inputStyles} ${startAdornment ? "pl-9" : ""} ${endAdornment ? "pr-9" : ""}` : inputStyles}
        {...props}
      />
    );

    return (
      <div className={wrapperClassName}>
        {label && <label className={LABEL_STYLES}>{label}</label>}

        {hasAdornment ? (
          <div className="relative">
            {startAdornment && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {startAdornment}
              </div>
            )}
            {inputElement}
            {endAdornment && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {endAdornment}
              </div>
            )}
          </div>
        ) : (
          inputElement
        )}

        {error && <p className={ERROR_TEXT_STYLES}>{error}</p>}
        {helperText && !error && <p className={HELPER_STYLES}>{helperText}</p>}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";

/**
 * Exported input styles for cases where you need just the className
 * without the full component wrapper
 */
export const TEXT_INPUT_STYLES = INPUT_BASE_STYLES;
