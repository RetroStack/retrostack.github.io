"use client";

import { Header } from "./Header";
import { Footer } from "./Footer";
import { ResponsiveToolbar, ToolbarItem } from "@/components/ui/ResponsiveToolbar";

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
  /** Right sidebar content */
  rightSidebar?: React.ReactNode;
  /** Right sidebar width */
  rightSidebarWidth?: string;
  /** Whether left sidebar should be collapsible on mobile */
  leftSidebarCollapsible?: boolean;
  /** Whether right sidebar should be collapsible on mobile */
  rightSidebarCollapsible?: boolean;
  className?: string;
}

export function ToolContent({
  children,
  sidebar,
  sidebarPosition = "left",
  sidebarWidth = "280px",
  leftSidebar,
  leftSidebarWidth = "220px",
  rightSidebar,
  rightSidebarWidth = "80px",
  leftSidebarCollapsible = true,
  rightSidebarCollapsible = true,
  className = "",
}: ToolContentProps) {
  // Legacy single sidebar support
  const effectiveLeftSidebar = leftSidebar ?? (sidebarPosition === "left" ? sidebar : undefined);
  const effectiveRightSidebar = rightSidebar ?? (sidebarPosition === "right" ? sidebar : undefined);
  const effectiveLeftWidth = leftSidebar ? leftSidebarWidth : sidebarWidth;
  const effectiveRightWidth = rightSidebar ? rightSidebarWidth : sidebarWidth;

  // No sidebars
  if (!effectiveLeftSidebar && !effectiveRightSidebar) {
    return (
      <div className={`h-full overflow-auto ${className}`}>
        {children}
      </div>
    );
  }

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
