/**
 * Toggle Switch Component
 *
 * iOS-style toggle switch with retro color scheme:
 * - Pink when on (active state)
 * - Purple when off (inactive state)
 *
 * Used instead of checkboxes throughout the app for
 * better touch targets and visual consistency.
 *
 * @module components/ui/ToggleSwitch
 */
"use client";

export interface ToggleSwitchProps {
  /** Whether the toggle is on */
  checked: boolean;
  /** Callback when the toggle changes */
  onChange: (checked: boolean) => void;
  /** Optional ID for label association */
  id?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * iOS-style toggle switch component
 * Pink when on, purple when off
 */
export function ToggleSwitch({
  checked,
  onChange,
  id,
  disabled = false,
  className = "",
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
        border-2 transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-retro-cyan focus:ring-offset-2 focus:ring-offset-retro-dark
        ${checked ? "bg-retro-pink border-retro-pink" : "bg-retro-purple/50 border-retro-purple"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full
          shadow ring-0 transition duration-200 ease-in-out
          ${checked ? "translate-x-5 bg-white" : "translate-x-0 bg-gray-400"}
        `}
      />
    </button>
  );
}
