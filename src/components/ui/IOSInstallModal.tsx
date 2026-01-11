/**
 * iOS Install Instructions Modal
 *
 * Shows step-by-step instructions for installing the PWA on iOS devices
 * using the "Add to Home Screen" Safari feature.
 *
 * iOS does not support the beforeinstallprompt API, so users must
 * manually add the app to their home screen via Safari's share menu.
 *
 * @module components/ui/IOSInstallModal
 */
"use client";

import { Modal, ModalHeader, ModalContent } from "@/components/ui/Modal";

export interface IOSInstallModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
}

/**
 * Modal with instructions for installing the PWA on iOS devices
 *
 * @example
 * ```tsx
 * <IOSInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
 * ```
 */
export function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" ariaLabel="Install RetroStack on iOS">
      <ModalHeader onClose={onClose} showCloseButton>
        <h2 className="text-lg font-medium text-white">Install RetroStack</h2>
      </ModalHeader>
      <ModalContent>
        <p className="text-gray-400 mb-4">To install RetroStack on your iOS device:</p>
        <ol className="space-y-4 text-gray-300">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-retro-cyan/20 text-retro-cyan text-sm flex items-center justify-center">
              1
            </span>
            <span>
              Tap the{" "}
              <strong className="text-retro-cyan">
                Share
                <svg
                  className="inline w-5 h-5 ml-1 -mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </strong>{" "}
              button in Safari
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-retro-cyan/20 text-retro-cyan text-sm flex items-center justify-center">
              2
            </span>
            <span>
              Scroll down and tap <strong className="text-retro-cyan">Add to Home Screen</strong>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-retro-cyan/20 text-retro-cyan text-sm flex items-center justify-center">
              3
            </span>
            <span>
              Tap <strong className="text-retro-cyan">Add</strong> in the top right
            </span>
          </li>
        </ol>
        <p className="text-gray-500 text-sm mt-4">
          The app will be added to your home screen and can be used offline.
        </p>
      </ModalContent>
    </Modal>
  );
}
