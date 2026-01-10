/**
 * Toast Notification Provider
 *
 * Context provider for the toast notification system. Wrap your app
 * with this provider to enable toast notifications via useToast hook.
 *
 * Features:
 * - Automatic stacking (max 5 toasts visible)
 * - Convenience methods: success(), error(), info(), warning()
 * - Positioned at bottom-right of viewport
 * - Auto-dismissal with configurable duration
 *
 * @module components/ui/ToastProvider
 */
"use client";

import { createContext, useCallback, useState, ReactNode } from "react";
import { Toast, ToastVariant } from "./Toast";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

export interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

const MAX_TOASTS = 5;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", duration: number = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, message, variant, duration };

      setToasts((prev) => {
        // Keep only the most recent toasts up to MAX_TOASTS - 1, then add new one
        const updated = [...prev.slice(-(MAX_TOASTS - 1)), newToast];
        return updated;
      });
    },
    []
  );

  const success = useCallback(
    (message: string, duration?: number) => showToast(message, "success", duration),
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => showToast(message, "error", duration),
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => showToast(message, "info", duration),
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => showToast(message, "warning", duration),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast container - bottom right */}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              message={toast.message}
              variant={toast.variant}
              duration={toast.duration}
              onDismiss={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
