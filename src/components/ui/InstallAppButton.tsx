/**
 * Install App Button
 *
 * Button that appears when the app can be installed as a PWA.
 * - On supported browsers: triggers native install prompt
 * - On iOS: shows modal with Add to Home Screen instructions
 * - Hidden when already installed or not installable
 *
 * @module components/ui/InstallAppButton
 */
"use client";

import { useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Tooltip } from "@/components/ui/Tooltip";
import { IOSInstallModal } from "@/components/ui/IOSInstallModal";

export interface InstallAppButtonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Button to trigger PWA installation
 *
 * @example
 * ```tsx
 * <InstallAppButton className="hidden sm:block" />
 * ```
 */
export function InstallAppButton({ className = "" }: InstallAppButtonProps) {
  const { canInstall, isIOS, promptInstall, mounted } = useInstallPrompt();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || !canInstall) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      await promptInstall();
    }
  };

  return (
    <>
      <Tooltip content="Install app" position="bottom">
        <button
          onClick={handleClick}
          className={`p-2 rounded-lg transition-colors hover:bg-retro-grid/20 ${className}`}
          aria-label="Install RetroStack app"
        >
          <svg
            className="w-5 h-5 text-text-secondary hover:text-retro-cyan transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </Tooltip>

      <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />
    </>
  );
}
