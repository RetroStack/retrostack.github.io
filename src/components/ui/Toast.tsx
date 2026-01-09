"use client";

import { useCallback, useEffect, useState } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onDismiss: (id: string) => void;
}

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  success: {
    bg: "bg-green-900/90",
    border: "border-green-500/50",
    icon: "text-green-400",
  },
  error: {
    bg: "bg-red-900/90",
    border: "border-red-500/50",
    icon: "text-red-400",
  },
  info: {
    bg: "bg-retro-navy/90",
    border: "border-retro-cyan/50",
    icon: "text-retro-cyan",
  },
  warning: {
    bg: "bg-yellow-900/90",
    border: "border-yellow-500/50",
    icon: "text-yellow-400",
  },
};

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

export function Toast({ id, message, variant = "info", duration = 4000, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, handleDismiss]);

  const styles = variantStyles[variant];

  // Enter: slide in from right + fade in
  // Leave: fade out only (no slide) for cleaner close animation
  const getAnimationStyles = (): React.CSSProperties => {
    if (isLeaving) {
      return { transform: "translateX(0) scale(0.95)", opacity: 0 };
    }
    if (isVisible) {
      return { transform: "translateX(0) scale(1)", opacity: 1 };
    }
    return { transform: "translateX(100%) scale(1)", opacity: 0 };
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm
        ${styles.bg} ${styles.border}
        cursor-pointer hover:scale-[1.02]
        min-w-[280px] max-w-[400px]
      `}
      style={{
        ...getAnimationStyles(),
        transition: "transform 300ms ease-out, opacity 300ms ease-out",
      }}
      onClick={handleDismiss}
      role="alert"
    >
      <span className={styles.icon}>{variantIcons[variant]}</span>
      <span className="flex-1 text-sm text-gray-100 font-ui">{message}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="text-gray-400 hover:text-gray-200 transition-colors p-1"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
