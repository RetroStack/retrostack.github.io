/**
 * Tool Page Layout Components
 *
 * Layout wrapper for tool pages (character-rom-editor, etc.).
 * Provides consistent structure with header, optional toolbar,
 * main content area, and optional footer.
 *
 * Components:
 * - ToolLayout: Full page wrapper with viewport locking
 * - ToolContent: Content area with optional sidebars (left, right, or both)
 *
 * Designed for full-height tool interfaces that shouldn't scroll
 * the page, only their internal content areas.
 *
 * Mobile behavior:
 * - Sidebars display as bottom sheets on mobile (below lg breakpoint)
 * - Floating tab bar at bottom allows toggling sheets
 * - Content area takes full height when sheets are closed
 *
 * @module components/layout/ToolLayout
 */
"use client";

import { useState, useCallback } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ResponsiveToolbar, ToolbarItem } from "@/components/ui/ResponsiveToolbar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface ToolLayoutProps {
  title: string;
  children: React.ReactNode;
  toolbar?: ToolbarItem[];
  showFooter?: boolean;
  fullHeight?: boolean;
  className?: string;
}

export function ToolLayout({
  title,
  children,
  toolbar,
  showFooter = false,
  fullHeight = true,
  className = "",
}: ToolLayoutProps) {
  return (
    <div className={`flex flex-col safe-top ${fullHeight ? "viewport-locked" : "min-h-screen"}`}>
      <Header />

      {/* Toolbar */}
      {toolbar && toolbar.length > 0 && (
        <ResponsiveToolbar
          actions={toolbar}
          sticky
          className="mt-[var(--header-height)]"
        />
      )}

      {/* Main Content */}
      <main
        className={`
          flex-1 bg-retro-dark
          ${!toolbar ? "mt-[var(--header-height)]" : ""}
          ${fullHeight ? "tool-canvas overflow-hidden" : ""}
          ${className}
        `}
      >
        {/* Screen reader only title */}
        <h1 className="sr-only">{title}</h1>

        {children}
      </main>

      {/* Footer - optional for tool pages */}
      {showFooter && <Footer />}
    </div>
  );
}

/**
 * A simpler content wrapper for tool pages that don't need the full layout.
 * Use this inside ToolLayout for the main content area.
 * Supports single sidebar (left or right) or dual sidebars (left and right).
 *
 * On mobile (below lg breakpoint), sidebars are rendered as bottom sheets
 * with a floating tab bar for access.
 */
interface ToolContentProps {
  children: React.ReactNode;
  /** Legacy single sidebar prop */
  sidebar?: React.ReactNode;
  /** Legacy sidebar position prop */
  sidebarPosition?: "left" | "right";
  /** Legacy sidebar width prop */
  sidebarWidth?: string;
  /** Left sidebar content */
  leftSidebar?: React.ReactNode;
  /** Left sidebar width */
  leftSidebarWidth?: string;
  /** Left sidebar title (shown in bottom sheet header on mobile) */
  leftSidebarTitle?: string;
  /** Right sidebar content */
  rightSidebar?: React.ReactNode;
  /** Right sidebar width */
  rightSidebarWidth?: string;
  /** Right sidebar title (shown in bottom sheet header on mobile) */
  rightSidebarTitle?: string;
  /** Whether left sidebar should be collapsible on mobile */
  leftSidebarCollapsible?: boolean;
  /** Whether right sidebar should be collapsible on mobile */
  rightSidebarCollapsible?: boolean;
  /** Whether to use bottom sheets on mobile (default: true) */
  useBottomSheets?: boolean;
  className?: string;
}

export function ToolContent({
  children,
  sidebar,
  sidebarPosition = "left",
  sidebarWidth = "280px",
  leftSidebar,
  leftSidebarWidth = "220px",
  leftSidebarTitle = "Panel",
  rightSidebar,
  rightSidebarWidth = "80px",
  rightSidebarTitle = "Tools",
  leftSidebarCollapsible = true,
  rightSidebarCollapsible = true,
  useBottomSheets = true,
  className = "",
}: ToolContentProps) {
  const isMobile = useIsMobile();
  const [activeSheet, setActiveSheet] = useState<"left" | "right" | null>(null);

  // Legacy single sidebar support
  const effectiveLeftSidebar = leftSidebar ?? (sidebarPosition === "left" ? sidebar : undefined);
  const effectiveRightSidebar = rightSidebar ?? (sidebarPosition === "right" ? sidebar : undefined);
  const effectiveLeftWidth = leftSidebar ? leftSidebarWidth : sidebarWidth;
  const effectiveRightWidth = rightSidebar ? rightSidebarWidth : sidebarWidth;

  const openLeftSheet = useCallback(() => setActiveSheet("left"), []);
  const openRightSheet = useCallback(() => setActiveSheet("right"), []);
  const closeSheet = useCallback(() => setActiveSheet(null), []);

  // No sidebars
  if (!effectiveLeftSidebar && !effectiveRightSidebar) {
    return (
      <div className={`h-full overflow-auto ${className}`}>
        {children}
      </div>
    );
  }

  // Mobile bottom sheet layout
  if (isMobile && useBottomSheets && (leftSidebarCollapsible || rightSidebarCollapsible)) {
    return (
      <div className="h-full flex flex-col relative">
        {/* Main Content - full height */}
        <div
          className={`
            flex-1 overflow-auto
            flex items-center justify-center
            pb-14
            ${className}
          `}
        >
          {children}
        </div>

        {/* Bottom Tab Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-retro-navy border-t border-retro-grid/50 safe-bottom">
          <div className="flex justify-around py-2 px-4">
            {effectiveLeftSidebar && leftSidebarCollapsible && (
              <button
                onClick={openLeftSheet}
                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-lg
                  transition-colors min-w-[80px]
                  ${activeSheet === "left" ? "bg-retro-cyan/20 text-retro-cyan" : "text-gray-400 hover:text-gray-200"}
                `}
                aria-label={`Open ${leftSidebarTitle}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span className="text-xs">{leftSidebarTitle}</span>
              </button>
            )}
            {effectiveRightSidebar && rightSidebarCollapsible && (
              <button
                onClick={openRightSheet}
                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-lg
                  transition-colors min-w-[80px]
                  ${activeSheet === "right" ? "bg-retro-pink/20 text-retro-pink" : "text-gray-400 hover:text-gray-200"}
                `}
                aria-label={`Open ${rightSidebarTitle}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="text-xs">{rightSidebarTitle}</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Sheets */}
        {effectiveLeftSidebar && leftSidebarCollapsible && (
          <BottomSheet
            isOpen={activeSheet === "left"}
            onClose={closeSheet}
            title={leftSidebarTitle}
            expandedHeight="70vh"
            collapsedHeight="40vh"
          >
            {effectiveLeftSidebar}
          </BottomSheet>
        )}
        {effectiveRightSidebar && rightSidebarCollapsible && (
          <BottomSheet
            isOpen={activeSheet === "right"}
            onClose={closeSheet}
            title={rightSidebarTitle}
            expandedHeight="60vh"
            collapsedHeight="35vh"
          >
            {effectiveRightSidebar}
          </BottomSheet>
        )}
      </div>
    );
  }

  // Desktop sidebar layout (unchanged)
  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left Sidebar */}
      {effectiveLeftSidebar && (
        <aside
          className={`
            w-full lg:w-auto lg:flex-shrink-0
            ${leftSidebarCollapsible ? "border-b lg:border-b-0" : ""}
            lg:border-r border-retro-grid/50
            bg-retro-navy/50
            overflow-y-auto
            ${leftSidebarCollapsible ? "max-h-[30vh] lg:max-h-none" : ""}
          `}
          style={{ ["--sidebar-width" as string]: effectiveLeftWidth }}
        >
          <div className="lg:w-[var(--sidebar-width)] h-full">
            {effectiveLeftSidebar}
          </div>
        </aside>
      )}

      {/* Main Content - centered */}
      <div
        className={`
          flex-1 overflow-auto
          flex items-center justify-center
          ${className}
        `}
      >
        {children}
      </div>

      {/* Right Sidebar */}
      {effectiveRightSidebar && (
        <aside
          className={`
            w-full lg:w-auto lg:flex-shrink-0
            ${rightSidebarCollapsible ? "border-t lg:border-t-0" : ""}
            lg:border-l border-retro-grid/50
            bg-retro-navy/50
            overflow-y-auto
            ${rightSidebarCollapsible ? "max-h-[30vh] lg:max-h-none" : ""}
          `}
          style={{ ["--sidebar-width" as string]: effectiveRightWidth }}
        >
          <div className="lg:w-[var(--sidebar-width)] h-full">
            {effectiveRightSidebar}
          </div>
        </aside>
      )}
    </div>
  );
}
