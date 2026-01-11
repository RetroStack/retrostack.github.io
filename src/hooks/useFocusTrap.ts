/**
 * Focus Trap Hook
 *
 * Traps keyboard focus within a container element (e.g., modals, dialogs).
 * Handles Tab/Shift+Tab cycling and restores focus when unmounted.
 *
 * @module hooks/useFocusTrap
 */
import { useEffect, useRef, useCallback, type RefObject } from "react";

const FOCUSABLE_SELECTORS = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  isActive: boolean;
  /** Whether to restore focus to the previously focused element when deactivated */
  restoreFocus?: boolean;
  /** Whether to auto-focus the first focusable element when activated */
  autoFocus?: boolean;
}

/**
 * Hook that traps focus within a container element.
 *
 * @param options - Configuration options
 * @returns Ref to attach to the container element
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, children }) {
 *   const containerRef = useFocusTrap({ isActive: isOpen });
 *   return <div ref={containerRef}>{children}</div>;
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isActive,
  restoreFocus = true,
  autoFocus = true,
}: UseFocusTrapOptions): RefObject<T | null> {
  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter((el) => {
      // Filter out elements that are not visible
      return el.offsetParent !== null && !el.hasAttribute("inert");
    });
  }, []);

  // Handle tab key to cycle focus within container
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab from first element -> go to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab from last element -> go to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
      // If focus is outside container, bring it back
      else if (
        containerRef.current &&
        !containerRef.current.contains(document.activeElement)
      ) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, getFocusableElements]);

  // Store previously focused element and auto-focus on activation
  useEffect(() => {
    if (isActive) {
      // Store currently focused element
      if (restoreFocus) {
        previouslyFocusedRef.current = document.activeElement as HTMLElement;
      }

      // Auto-focus first focusable element
      if (autoFocus) {
        // Small delay to ensure the modal is rendered
        requestAnimationFrame(() => {
          const focusableElements = getFocusableElements();
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else if (containerRef.current) {
            // If no focusable elements, focus the container itself
            containerRef.current.setAttribute("tabindex", "-1");
            containerRef.current.focus();
          }
        });
      }
    }

    return () => {
      // Restore focus when deactivated
      if (isActive && restoreFocus && previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
        previouslyFocusedRef.current = null;
      }
    };
  }, [isActive, restoreFocus, autoFocus, getFocusableElements]);

  return containerRef;
}
