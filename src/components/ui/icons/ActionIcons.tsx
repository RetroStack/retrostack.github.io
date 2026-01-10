/**
 * Action Icons
 *
 * Icons for common actions like copy, delete, clear, fill, and invert.
 * Used throughout the character editor and other tool interfaces.
 *
 * Icons included:
 * - AddIcon: Plus sign for adding new items
 * - CopyIcon: Duplicate/copy to clipboard
 * - DeleteIcon: Delete/trash with lid and lines
 * - ClearIcon: Empty/hollow square (clear to empty)
 * - FillIcon: Solid filled square (fill with content)
 * - InvertIcon: Moon/contrast symbol (invert colors)
 *
 * @module components/ui/icons/ActionIcons
 */
import { IconProps, getIconClass } from "./types";

/**
 * Add character icon - Letter A with plus sign
 */
export function AddIcon({ className, size, ...props }: IconProps) {
  return (
    <svg className={getIconClass(size, className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      {/* Letter A */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l3.5-10h3L17 17M8.5 13h7" />
      {/* Plus sign */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 4v4m-2-2h4" />
    </svg>
  );
}

/**
 * Copy/duplicate icon
 */
export function CopyIcon({ className, size, ...props }: IconProps) {
  return (
    <svg className={getIconClass(size, className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

/**
 * Delete/trash icon
 */
export function DeleteIcon({ className, size, ...props }: IconProps) {
  return (
    <svg className={getIconClass(size, className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

/**
 * Clear icon - hollow/empty square representing clearing to empty
 */
export function ClearIcon({ className, size, ...props }: IconProps) {
  return (
    <svg className={getIconClass(size, className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth={2} />
    </svg>
  );
}

/**
 * Fill icon - solid filled square representing filling with content
 */
export function FillIcon({ className, size, ...props }: IconProps) {
  return (
    <svg className={getIconClass(size, className)} viewBox="0 0 24 24" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Invert icon - moon/contrast symbol for inverting colors
 */
export function InvertIcon({ className, size, ...props }: IconProps) {
  return (
    <svg className={getIconClass(size, className)} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}
