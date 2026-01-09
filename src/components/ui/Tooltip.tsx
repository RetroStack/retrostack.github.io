"use client";
/* eslint-disable react-hooks/set-state-in-effect -- SSR-safe client detection */

import { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { createPortal } from "react-dom";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  shortcut?: string;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  shortcut,
  position = "top",
  delay = 300,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure we only render portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  // Calculate position and adjust if tooltip would overflow viewport
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 8;

    let newPosition = position;

    // Check if tooltip would overflow and flip if needed
    if (position === "top" && triggerRect.top - tooltipRect.height < gap) {
      newPosition = "bottom";
    } else if (position === "bottom" && triggerRect.bottom + tooltipRect.height > viewportHeight - gap) {
      newPosition = "top";
    } else if (position === "left" && triggerRect.left - tooltipRect.width < gap) {
      newPosition = "right";
    } else if (position === "right" && triggerRect.right + tooltipRect.width > viewportWidth - gap) {
      newPosition = "left";
    }

    // Calculate fixed position based on trigger element
    let top = 0;
    let left = 0;

    switch (newPosition) {
      case "top":
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + gap;
        break;
    }

    // Clamp to viewport
    left = Math.max(gap, Math.min(left, viewportWidth - tooltipRect.width - gap));
    top = Math.max(gap, Math.min(top, viewportHeight - tooltipRect.height - gap));

    setTooltipStyle({ top, left });

    if (newPosition !== actualPosition) {
      setActualPosition(newPosition);
    }
  }, [isVisible, position, actualPosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const arrowStyles: Record<TooltipPosition, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent",
  };

  const tooltipContent = isVisible && mounted && (
    <div
      ref={tooltipRef}
      role="tooltip"
      style={tooltipStyle}
      className={`
        fixed z-[9999] px-2.5 py-1.5 text-xs font-ui
        bg-gray-800/95 text-gray-100 rounded-md shadow-lg
        border border-gray-700/50 backdrop-blur-sm
        pointer-events-none
        animate-in fade-in duration-150
        ${typeof content === "string" ? "whitespace-nowrap" : ""}
      `}
    >
      {typeof content === "string" ? <span>{content}</span> : content}
      {shortcut && typeof content === "string" && (
        <span className="ml-2 text-gray-400 font-mono text-[10px] bg-gray-700/50 px-1.5 py-0.5 rounded">
          {shortcut}
        </span>
      )}
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 border-4 ${arrowStyles[actualPosition]}`}
      />
    </div>
  );

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {mounted && tooltipContent && createPortal(tooltipContent, document.body)}
    </div>
  );
}

// Convenience component for icon buttons with tooltips
interface TooltipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  shortcut?: string;
  tooltipPosition?: TooltipPosition;
  children: ReactNode;
}

export function TooltipButton({
  tooltip,
  shortcut,
  tooltipPosition = "top",
  children,
  ...props
}: TooltipButtonProps) {
  return (
    <Tooltip content={tooltip} shortcut={shortcut} position={tooltipPosition}>
      <button {...props}>{children}</button>
    </Tooltip>
  );
}
