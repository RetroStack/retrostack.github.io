/**
 * Arrow Icons
 *
 * Directional arrow icons for navigation and UI feedback.
 * All icons use consistent sizing via IconProps and getIconClass utility.
 *
 * Icons included:
 * - ArrowUpIcon: Points upward (chevron style)
 * - ArrowDownIcon: Points downward (chevron style)
 * - ArrowLeftIcon: Points left (chevron style)
 * - ArrowRightIcon: Points right (chevron style)
 *
 * @module components/ui/icons/ArrowIcons
 */
import { IconProps, getIconClass } from "./types";

/**
 * Arrow pointing upward
 */
export function ArrowUpIcon({ className, size, ...props }: IconProps) {
  return (
    <svg
      className={getIconClass(size, className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

/**
 * Arrow pointing downward
 */
export function ArrowDownIcon({ className, size, ...props }: IconProps) {
  return (
    <svg
      className={getIconClass(size, className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/**
 * Arrow pointing left
 */
export function ArrowLeftIcon({ className, size, ...props }: IconProps) {
  return (
    <svg
      className={getIconClass(size, className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

/**
 * Arrow pointing right
 */
export function ArrowRightIcon({ className, size, ...props }: IconProps) {
  return (
    <svg
      className={getIconClass(size, className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
