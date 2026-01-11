/**
 * Tabbed Panel Component
 *
 * A reusable tabbed interface for organizing content into multiple sections.
 * Used inside modals to consolidate related functionality.
 *
 * Features:
 * - Keyboard navigation (arrow keys, Home/End)
 * - ARIA-compliant tab pattern
 * - Controlled and uncontrolled modes
 * - Custom tab styling
 *
 * @module components/ui/TabbedPanel
 */
"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";

export interface TabDefinition {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Optional icon to display before the label */
  icon?: React.ReactNode;
  /** Tab content */
  content: React.ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
}

export interface TabbedPanelProps {
  /** Array of tab definitions */
  tabs: TabDefinition[];
  /** Currently active tab ID (controlled mode) */
  activeTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Default active tab ID (uncontrolled mode) */
  defaultTab?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Tab bar position */
  tabPosition?: "top" | "left";
}

/**
 * Tabbed panel with keyboard navigation and ARIA support
 */
export function TabbedPanel({
  tabs,
  activeTab: controlledActiveTab,
  onTabChange,
  defaultTab,
  className = "",
  tabPosition = "top",
}: TabbedPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");
  const tabListRef = useRef<HTMLDivElement>(null);

  // Use controlled or uncontrolled mode
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (controlledActiveTab === undefined) {
        setInternalActiveTab(tabId);
      }
      onTabChange?.(tabId);
    },
    [controlledActiveTab, onTabChange]
  );

  // Get enabled tabs for keyboard navigation
  const enabledTabs = tabs.filter((tab) => !tab.disabled);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = enabledTabs.findIndex((tab) => tab.id === activeTab);
      let newIndex = currentIndex;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          newIndex = (currentIndex + 1) % enabledTabs.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          newIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = enabledTabs.length - 1;
          break;
        default:
          return;
      }

      const newTab = enabledTabs[newIndex];
      if (newTab) {
        handleTabChange(newTab.id);
        // Focus the new tab button
        const tabButton = tabListRef.current?.querySelector(`[data-tab-id="${newTab.id}"]`) as HTMLButtonElement;
        tabButton?.focus();
      }
    },
    [activeTab, enabledTabs, handleTabChange]
  );

  // Find active tab content
  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  const isHorizontal = tabPosition === "top";

  return (
    <div className={`flex ${isHorizontal ? "flex-col" : "flex-row"} ${className}`}>
      {/* Tab List */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-orientation={isHorizontal ? "horizontal" : "vertical"}
        className={`
          flex ${isHorizontal ? "flex-row border-b" : "flex-col border-r"}
          border-retro-grid/30 bg-retro-navy/30
          ${isHorizontal ? "gap-1 px-2" : "gap-1 py-2"}
        `}
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => handleTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium
              transition-colors rounded-t-lg
              ${isHorizontal ? "" : "rounded-t-none rounded-l-lg"}
              ${
                activeTab === tab.id
                  ? "bg-retro-dark text-retro-cyan border-b-2 border-retro-cyan -mb-px"
                  : "text-gray-400 hover:text-gray-200 hover:bg-retro-dark/50"
              }
              ${tab.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panel */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={activeTab}
        className="flex-1 min-h-0"
      >
        {activeTabContent}
      </div>
    </div>
  );
}
