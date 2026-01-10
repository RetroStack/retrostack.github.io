/**
 * Confirmation Dialog Component
 *
 * Modal dialog for confirming destructive or important actions.
 * Provides cancel/confirm buttons with keyboard support (Escape to cancel).
 *
 * Variants:
 * - danger: Red - destructive actions (delete, discard)
 * - warning: Orange - potentially risky actions
 * - info: Cyan - informational confirmations
 *
 * Works reliably across all platforms including iOS/iPad.
 *
 * @module components/ui/ConfirmDialog
 */
"use client";

import { useEffect, useRef } from "react";

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Optional additional details shown below the message */
  details?: React.ReactNode;
  /** Text for confirm button */
  confirmLabel?: string;
  /** Text for cancel button */
  cancelLabel?: string;
  /** Variant affects confirm button styling */
  variant?: "danger" | "warning" | "info";
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels or closes */
  onCancel: () => void;
}

const variantStyles = {
  danger: "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30",
  warning: "bg-orange-500/20 border-orange-500 text-orange-400 hover:bg-orange-500/30",
  info: "bg-retro-cyan/20 border-retro-cyan text-retro-cyan hover:bg-retro-cyan/30",
};

/**
 * Reusable confirmation dialog component.
 * Works reliably on all platforms including iOS/iPad.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  details,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "info",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button when dialog opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-medium text-white mb-2"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="text-sm text-gray-400 mb-4"
        >
          {message}
        </p>
        {details && (
          <div className="text-xs text-gray-500 mb-6">
            {details}
          </div>
        )}
        <div className={`flex gap-3 ${!details ? "mt-2" : ""}`}>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-sm border rounded transition-colors ${variantStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
