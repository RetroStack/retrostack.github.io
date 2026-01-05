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
    <div className="min-h-screen flex flex-col safe-top">
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
 */
interface ToolContentProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarPosition?: "left" | "right";
  sidebarWidth?: string;
  className?: string;
}

export function ToolContent({
  children,
  sidebar,
  sidebarPosition = "left",
  sidebarWidth = "280px",
  className = "",
}: ToolContentProps) {
  if (!sidebar) {
    return (
      <div className={`h-full overflow-auto ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Sidebar - collapsible on mobile */}
      <aside
        className={`
          w-full lg:w-auto lg:flex-shrink-0
          border-b lg:border-b-0
          ${sidebarPosition === "left" ? "lg:border-r" : "lg:border-l lg:order-2"}
          border-retro-grid/50
          bg-retro-navy/50
          overflow-y-auto
          max-h-[30vh] lg:max-h-none
        `}
        style={{ ["--sidebar-width" as string]: sidebarWidth }}
      >
        <div className="p-3 sm:p-4 lg:w-[var(--sidebar-width)]">
          {sidebar}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`
          flex-1 overflow-auto
          ${sidebarPosition === "right" ? "lg:order-1" : ""}
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
}
