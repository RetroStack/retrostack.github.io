/**
 * Modal Dialog Components
 *
 * Reusable modal system with backdrop, keyboard handling, and sizing options.
 * Provides compositional sub-components for flexible layouts:
 * - Modal: Main wrapper with backdrop and keyboard handling
 * - ModalHeader: Title area with optional close button
 * - ModalContent: Main content area (optionally scrollable)
 * - ModalFooter: Custom footer content
 * - ModalActions: Standard Cancel/Confirm button pattern
 *
 * Supports Escape to close and optional Enter to confirm.
 *
 * @module components/ui/Modal
 */
"use client";

import { useCallback, type ReactNode, type KeyboardEvent } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

// ============================================================================
// Types
// ============================================================================

export type ModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
export type ModalMaxHeight = "70vh" | "80vh" | "90vh" | "auto";

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal size (max-width). Defaults to "md" */
  size?: ModalSize;
  /** Maximum height constraint. Defaults to "auto" */
  maxHeight?: ModalMaxHeight;
  /** Optional callback for Enter key (when confirmOnEnter is true) */
  onConfirm?: () => void;
  /** Whether Enter key triggers onConfirm. Defaults to false */
  confirmOnEnter?: boolean;
  /** Modal content */
  children: ReactNode;
  /** Additional CSS classes for the modal container */
  className?: string;
  /** ARIA label for the modal */
  ariaLabel?: string;
}

export interface ModalHeaderProps {
  /** Header content (typically title text or elements) */
  children: ReactNode;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Whether to show the close button. Defaults to false */
  showCloseButton?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface ModalContentProps {
  /** Content children */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether content area should be scrollable. Defaults to false */
  scrollable?: boolean;
}

export interface ModalFooterProps {
  /** Footer content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export type ModalActionVariant = "cyan" | "pink" | "danger";

export interface ModalActionsProps {
  /** Callback when cancel button is clicked */
  onCancel: () => void;
  /** Callback when confirm button is clicked */
  onConfirm: () => void;
  /** Cancel button label. Defaults to "Cancel" */
  cancelLabel?: string;
  /** Confirm button label. Defaults to "Apply" */
  confirmLabel?: string;
  /** Whether confirm button is disabled. Defaults to false */
  confirmDisabled?: boolean;
  /** Color variant for confirm button. Defaults to "cyan" */
  confirmVariant?: ModalActionVariant;
  /** Whether action is in progress (shows loading state). Defaults to false */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Size and style mappings
// ============================================================================

const sizeClasses: Record<ModalSize, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

const maxHeightClasses: Record<ModalMaxHeight, string> = {
  "70vh": "max-h-[70vh]",
  "80vh": "max-h-[80vh]",
  "90vh": "max-h-[90vh]",
  auto: "",
};

const confirmVariantClasses: Record<ModalActionVariant, string> = {
  cyan: "bg-retro-cyan/20 border-retro-cyan text-retro-cyan hover:bg-retro-cyan/30",
  pink: "bg-retro-pink/20 border-retro-pink text-retro-pink hover:bg-retro-pink/30",
  danger: "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30",
};

// ============================================================================
// Modal Component
// ============================================================================

/**
 * Reusable modal wrapper component.
 * Handles backdrop, positioning, keyboard events (Escape/Enter), and sizing.
 *
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={onClose} size="sm">
 *   <ModalContent>
 *     <h2 className="text-lg font-medium text-white mb-4">Title</h2>
 *     {/* Form content *\/}
 *   </ModalContent>
 *   <ModalActions onCancel={onClose} onConfirm={handleSubmit} />
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  size = "md",
  maxHeight = "auto",
  onConfirm,
  confirmOnEnter = false,
  children,
  className = "",
  ariaLabel,
}: ModalProps) {
  // Focus trap: keeps Tab navigation within the modal
  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    restoreFocus: true,
    autoFocus: true,
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && confirmOnEnter && onConfirm) {
        onConfirm();
      }
    },
    [onClose, confirmOnEnter, onConfirm]
  );

  if (!isOpen) return null;

  const sizeClass = sizeClasses[size];
  const maxHeightClass = maxHeightClasses[maxHeight];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container with focus trap */}
      <div
        ref={focusTrapRef}
        className={`
          relative w-full ${sizeClass} ${maxHeightClass}
          bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl
          ${maxHeight !== "auto" ? "flex flex-col" : ""}
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// ModalHeader Component
// ============================================================================

/**
 * Optional header component for modals with title and optional close button.
 * Use when you need a header with close button or bordered title area.
 *
 * For simple modals, you can just add an h2 in ModalContent instead.
 */
export function ModalHeader({
  children,
  onClose,
  showCloseButton = false,
  className = "",
}: ModalHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-4 border-b border-retro-grid/30 ${className}`}>
      <div className="flex-1">{children}</div>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// ModalContent Component
// ============================================================================

/**
 * Content area for modal body.
 * Provides consistent padding and optional scrollable behavior.
 */
export function ModalContent({
  children,
  className = "",
  scrollable = false,
}: ModalContentProps) {
  return (
    <div className={`p-6 ${scrollable ? "overflow-y-auto flex-1" : ""} ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// ModalFooter Component
// ============================================================================

/**
 * Footer area for modals.
 * Use for custom footer content or wrap ModalActions for more control.
 */
export function ModalFooter({ children, className = "" }: ModalFooterProps) {
  return (
    <div className={`p-4 border-t border-retro-grid/30 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// ModalActions Component
// ============================================================================

/**
 * Standard action buttons for modals (Cancel + Confirm pattern).
 * Provides consistent styling across all modals.
 */
export function ModalActions({
  onCancel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLabel = "Apply",
  confirmDisabled = false,
  confirmVariant = "cyan",
  isLoading = false,
  className = "",
}: ModalActionsProps) {
  const variantClass = confirmVariantClasses[confirmVariant];

  return (
    <div className={`flex gap-3 p-6 pt-0 ${className}`}>
      <button
        onClick={onCancel}
        className="flex-1 px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
      >
        {cancelLabel}
      </button>
      <button
        onClick={onConfirm}
        disabled={confirmDisabled || isLoading}
        className={`flex-1 px-4 py-2 text-sm border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClass}`}
      >
        {isLoading ? "..." : confirmLabel}
      </button>
    </div>
  );
}
