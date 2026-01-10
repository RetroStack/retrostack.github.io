/**
 * Navigation Components
 *
 * Desktop and tablet navigation for the site header:
 * - Navigation: Full desktop nav with dropdown menus (lg+)
 * - TabletNavigation: Condensed top-level links only (md to lg)
 *
 * Both read from NAV_ITEMS in constants.ts for consistent structure.
 *
 * @module components/layout/Navigation
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants";

export function Navigation() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Filter to only show enabled items
  const enabledItems = NAV_ITEMS.filter((item) => item.enabled);

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {enabledItems.map((item) => {
        // Filter children to only show enabled ones
        const enabledChildren = item.children?.filter((child) => child.enabled);
        const hasEnabledChildren = enabledChildren && enabledChildren.length > 0;

        return (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => hasEnabledChildren && setOpenDropdown(item.label)}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <Link
              href={item.href}
              className="px-3 xl:px-4 py-2 font-ui text-xs xl:text-sm uppercase tracking-wider text-gray-300 hover:text-retro-cyan transition-colors duration-200 whitespace-nowrap"
            >
              {item.label}
              {hasEnabledChildren && (
                <span className="ml-1 text-xs">▼</span>
              )}
            </Link>

            {hasEnabledChildren && openDropdown === item.label && (
              <div className="absolute left-0 top-full pt-2 z-50">
                <div className="glass rounded-md py-2 min-w-[220px] xl:min-w-[260px] shadow-lg shadow-retro-purple/20">
                  {enabledChildren.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-4 py-3 hover:bg-retro-purple/30 transition-colors duration-200 touch-target"
                    >
                      <span className="block font-ui text-sm text-retro-cyan">
                        {child.label}
                      </span>
                      <span className="block text-xs text-gray-400 mt-1">
                        {child.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Condensed navigation for tablet viewports (768px - 1023px).
 * Shows only top-level items without dropdowns.
 */
export function TabletNavigation() {
  // Filter to only show enabled items
  const enabledItems = NAV_ITEMS.filter((item) => item.enabled);

  return (
    <nav className="hidden md:flex lg:hidden items-center gap-1 overflow-x-auto">
      {enabledItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="px-3 py-2 font-ui text-xs uppercase tracking-wider text-gray-300 hover:text-retro-cyan transition-colors duration-200 whitespace-nowrap flex-shrink-0"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
