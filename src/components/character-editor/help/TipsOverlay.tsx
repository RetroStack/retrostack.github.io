/**
 * Tips Overlay Component
 *
 * Modal overlay displaying categorized tips and tricks for the character editor.
 * Features expandable categories, scrollable content, and auto-show toggle.
 *
 * @module components/character-editor/help/TipsOverlay
 */
"use client";

import { useEffect } from "react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { LightbulbIcon } from "@/components/ui/icons/ActionIcons";
import { TIPS_CATEGORIES } from "@/lib/character-editor/tips/content";
import { TipsCategory } from "./TipsCategory";

export interface TipsOverlayProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Whether auto-show on startup is enabled */
  autoShowEnabled: boolean;
  /** Callback to toggle auto-show preference */
  onAutoShowChange: (enabled: boolean) => void;
  /** Currently expanded category IDs */
  expandedCategories: string[];
  /** Callback to toggle category expansion */
  onToggleCategory: (categoryId: string) => void;
  /** Callback when overlay is closed for the first time */
  onFirstClose?: () => void;
}

/**
 * Tips & Tricks overlay modal
 */
export function TipsOverlay({
  isOpen,
  onClose,
  autoShowEnabled,
  onAutoShowChange,
  expandedCategories,
  onToggleCategory,
  onFirstClose,
}: TipsOverlayProps) {
  // Handle close with first-close callback
  const handleClose = () => {
    onFirstClose?.();
    onClose();
  };

  // Expand first category by default if nothing is expanded
  useEffect(() => {
    if (isOpen && expandedCategories.length === 0 && TIPS_CATEGORIES.length > 0) {
      // Find the first category with defaultExpanded or use the first category
      const defaultCategory =
        TIPS_CATEGORIES.find((cat) => cat.defaultExpanded) || TIPS_CATEGORIES[0];
      onToggleCategory(defaultCategory.id);
    }
  }, [isOpen, expandedCategories.length, onToggleCategory]);

  // Check if a category is expanded (either explicitly or by default)
  const isCategoryExpanded = (categoryId: string) => {
    return expandedCategories.includes(categoryId);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" maxHeight="80vh" ariaLabel="Tips and Tricks">
      {/* Header */}
      <ModalHeader onClose={handleClose} showCloseButton>
        <div className="flex items-center gap-3">
          <div className="text-retro-amber">
            <LightbulbIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Tips & Tricks</h2>
            <p className="text-xs text-gray-400">Get the most out of the Character ROM Editor</p>
          </div>
        </div>
      </ModalHeader>

      {/* Scrollable content */}
      <ModalContent scrollable className="p-4">
        {/* Introduction */}
        <div className="mb-4 p-3 bg-retro-dark/50 rounded-lg border border-retro-grid/30">
          <p className="text-sm text-gray-300 leading-relaxed">
            Welcome to the Character ROM Editor! This guide covers all the features and shortcuts
            to help you create and edit character sets efficiently. Click on any category below to
            expand it and see detailed tips.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {TIPS_CATEGORIES.map((category) => (
            <TipsCategory
              key={category.id}
              category={category}
              isExpanded={isCategoryExpanded(category.id)}
              onToggle={() => onToggleCategory(category.id)}
            />
          ))}
        </div>
      </ModalContent>

      {/* Footer with toggle and close button */}
      <ModalFooter className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ToggleSwitch
            id="tips-auto-show"
            checked={autoShowEnabled}
            onChange={onAutoShowChange}
          />
          <label htmlFor="tips-auto-show" className="text-sm text-gray-400 cursor-pointer">
            Show on startup
          </label>
        </div>
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm border border-retro-grid/50 rounded text-gray-400 hover:border-retro-grid hover:text-white transition-colors"
        >
          Close
        </button>
      </ModalFooter>
    </Modal>
  );
}

TipsOverlay.displayName = "TipsOverlay";
