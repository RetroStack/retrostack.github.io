/**
 * Dropdown State Management Hook
 *
 * Combines useState for visibility with useOutsideClick for auto-closing.
 * Provides a complete solution for dropdown menus, popovers, and tooltips
 * with automatic cleanup on click outside or Escape key.
 *
 * @module hooks/useDropdown
 *
 * @example
 * const dropdown = useDropdown<HTMLDivElement>();
 * // dropdown.ref - attach to container
 * // dropdown.isOpen - current state
 * // dropdown.toggle() / dropdown.open() / dropdown.close()
 */
"use client";

import { useState, useCallback, RefObject } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";

/**
 * Result of the useDropdown hook
 */
export interface UseDropdownResult<T extends HTMLElement> {
  /** Whether the dropdown is currently open */
  isOpen: boolean;
  /** Ref to attach to the dropdown container element */
  ref: RefObject<T | null>;
  /** Toggle the dropdown open/closed */
  toggle: () => void;
  /** Open the dropdown */
  open: () => void;
  /** Close the dropdown */
  close: () => void;
}

/**
 * Hook that manages dropdown open/close state with outside click detection.
 * Combines useState for visibility with useOutsideClick for auto-closing.
 *
 * @example
 * ```tsx
 * function MyDropdown() {
 *   const dropdown = useDropdown<HTMLDivElement>();
 *
 *   return (
 *     <div ref={dropdown.ref}>
 *       <button onClick={dropdown.toggle}>
 *         Menu {dropdown.isOpen ? '▲' : '▼'}
 *       </button>
 *       {dropdown.isOpen && (
 *         <div className="dropdown-panel">
 *           <button onClick={() => { doSomething(); dropdown.close(); }}>
 *             Option 1
 *           </button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Object with isOpen state, ref, and toggle/open/close functions
 */
export function useDropdown<T extends HTMLElement = HTMLDivElement>(): UseDropdownResult<T> {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // useOutsideClick handles both clicks outside and Escape key
  const ref = useOutsideClick<T>(close, isOpen);

  return {
    isOpen,
    ref,
    toggle,
    open,
    close,
  };
}
