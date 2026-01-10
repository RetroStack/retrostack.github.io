/**
 * Transform Icons
 *
 * Icons for image/pixel transformation operations.
 * Used in the character editor toolbar for manipulating characters.
 *
 * Icons included:
 * - RotateLeftIcon: Counter-clockwise rotation
 * - RotateRightIcon: Clockwise rotation (mirrored left icon)
 * - FlipHorizontalIcon: Mirror left-right
 * - FlipVerticalIcon: Mirror top-bottom
 * - ScaleIcon: Resize/scale with corner arrows
 * - CenterIcon: Center/align with crosshair
 *
 * @module components/ui/icons/TransformIcons
 */
import { IconProps, getIconClass } from "./types";

/**
 * Rotate counter-clockwise icon
 */
export function RotateLeftIcon({ className, size, ...props }: IconProps) {
  return (
    <svg
      className={getIconClass(size, className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

/**
 * Rotate clockwise icon
 */
export function RotateRightIcon({ className, size, style, ...props }: IconProps) {
  return (
    <svg
      className={getIconClass(size, className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      style={{ transform: "scaleX(-1)", ...style }}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

/**
 * Flip horizontally icon (mirror left-right)
 */
export function FlipHorizontalIcon({ className, size, ...props }: IconProps) {
  return (
    <svg
      className={getIconClass(size, className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7h8M8 12h8m-8 5h8M4 3v18m16-18v18"
      />
    </svg>
  );
}

/**
 * Flip vertically icon (mirror top-bottom)
 */
export function FlipVerticalIcon({ className, size, ...props }: IconProps) {
  return (
    <svg
      className={getIconClass(size, className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 8v8M12 8v8m5-8v8M3 4h18M3 20h18"
      />
    </svg>
  );
}

/**
 * Scale/resize icon with corner arrows
 */
export function ScaleIcon({ className, size, ...props }: IconProps) {
  return (
    <svg
      className={getIconClass(size, className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4l4 4m0-4H4v4m16-4l-4 4m4 0V4h-4m-12 16l4-4m-4 0v4h4m12 0l-4-4m4 0v4h-4"
      />
    </svg>
  );
}

/**
 * Center/align icon with crosshair
 */
export function CenterIcon({ className, size, ...props }: IconProps) {
  return (
    <svg
      className={getIconClass(size, className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
    </svg>
  );
}
