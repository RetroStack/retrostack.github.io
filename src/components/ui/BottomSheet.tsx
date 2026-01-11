/**
 * Bottom Sheet Component
 *
 * A mobile-friendly sliding panel that appears from the bottom of the screen.
 * Features:
 * - Drag handle for pull-to-dismiss/expand
 * - Smooth CSS transitions
 * - Backdrop overlay with click-to-close
 * - Multiple snap points (collapsed, expanded, full)
 * - Swipe gestures for natural mobile interaction
 *
 * @module components/ui/BottomSheet
 */
"use client";

import { useRef, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Subscribe function for useSyncExternalStore (no-op as we only care about initial render)
const subscribe = () => () => {};
// Snapshot functions for client/server detection
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export type BottomSheetSnapPoint = "collapsed" | "expanded" | "full";

export interface BottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Title shown in the sheet header */
  title?: string;
  /** Initial snap point when opened (default: expanded) */
  initialSnap?: BottomSheetSnapPoint;
  /** Height when collapsed as percentage or px (default: 30vh) */
  collapsedHeight?: string;
  /** Height when expanded as percentage or px (default: 60vh) */
  expandedHeight?: string;
  /** Whether to allow full height (default: true) */
  allowFullHeight?: boolean;
  /** Additional CSS classes for the sheet content */
  className?: string;
}

/**
 * Mobile bottom sheet with drag gestures and snap points
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  initialSnap = "expanded",
  collapsedHeight = "30vh",
  expandedHeight = "60vh",
  allowFullHeight = true,
  className = "",
}: BottomSheetProps) {
  const [snapPoint, setSnapPoint] = useState<BottomSheetSnapPoint>(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentHeight = useRef(0);

  // Use useSyncExternalStore for hydration-safe client detection
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Get height based on snap point
  const getSnapHeight = useCallback(
    (snap: BottomSheetSnapPoint): string => {
      switch (snap) {
        case "collapsed":
          return collapsedHeight;
        case "expanded":
          return expandedHeight;
        case "full":
          return "calc(100vh - 60px)";
        default:
          return expandedHeight;
      }
    },
    [collapsedHeight, expandedHeight]
  );

  // Handle touch/mouse start
  const handleDragStart = useCallback(
    (clientY: number) => {
      setIsDragging(true);
      dragStartY.current = clientY;
      if (sheetRef.current) {
        currentHeight.current = sheetRef.current.getBoundingClientRect().height;
      }
    },
    []
  );

  // Handle touch/mouse move
  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;
      const delta = dragStartY.current - clientY;
      setDragOffset(delta);
    },
    [isDragging]
  );

  // Handle touch/mouse end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50; // pixels to trigger snap change

    // Determine new snap point based on drag direction and distance
    if (dragOffset < -threshold) {
      // Dragged down - collapse or close
      if (snapPoint === "collapsed" || snapPoint === "expanded") {
        onClose();
      } else {
        setSnapPoint("expanded");
      }
    } else if (dragOffset > threshold) {
      // Dragged up - expand
      if (snapPoint === "collapsed") {
        setSnapPoint("expanded");
      } else if (snapPoint === "expanded" && allowFullHeight) {
        setSnapPoint("full");
      }
    }

    setDragOffset(0);
  }, [isDragging, dragOffset, snapPoint, allowFullHeight, onClose]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleDragMove(e.touches[0].clientY);
    },
    [handleDragMove]
  );

  // Global mouse move/up handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isClient) return null;

  const sheetContent = (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40
          transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-retro-navy border-t border-retro-grid/50
          rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-y-0" : "translate-y-full"}
          ${isDragging ? "transition-none" : ""}
          ${className}
        `}
        style={{
          height: getSnapHeight(snapPoint),
          transform: isDragging
            ? `translateY(${isOpen ? -dragOffset : 0}px)`
            : isOpen
            ? "translateY(0)"
            : "translateY(100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Bottom sheet"}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-10 h-1 bg-gray-500 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-2 border-b border-retro-grid/30">
            <h2 className="text-sm font-medium text-gray-300">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-safe">{children}</div>
      </div>
    </>
  );

  return createPortal(sheetContent, document.body);
}

/**
 * Hook for managing bottom sheet state
 */
export function useBottomSheet(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}
