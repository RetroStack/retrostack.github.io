/**
 * Toast Notification Hook
 *
 * Provides access to the toast notification system for showing
 * temporary feedback messages to users. Must be used within
 * a ToastProvider context.
 *
 * Toast types:
 * - "success": Green toast for successful actions
 * - "error": Red toast for errors
 * - "warning": Amber toast for warnings
 * - "info": Blue toast for informational messages
 *
 * @module hooks/useToast
 *
 * @example
 * const { showToast } = useToast();
 * showToast("Changes saved!", "success");
 */
"use client";

import { useContext } from "react";
import { ToastContext, ToastContextType } from "@/components/ui/ToastProvider";

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
