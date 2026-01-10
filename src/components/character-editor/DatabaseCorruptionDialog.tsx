/**
 * Database Corruption Dialog
 *
 * Displayed when IndexedDB corruption is detected during database operations.
 * Provides a way for users to reset the database and recover from corruption.
 *
 * @module components/character-editor/DatabaseCorruptionDialog
 */
"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { resetDatabase } from "@/lib/character-editor/storage/storage";

export interface DatabaseCorruptionDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Error message describing the corruption (optional) */
  errorMessage?: string;
}

/**
 * Dialog shown when database corruption is detected.
 * Allows users to reset the database to recover from corruption.
 */
export function DatabaseCorruptionDialog({
  isOpen,
  errorMessage,
}: DatabaseCorruptionDialogProps) {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetDatabase();
      // resetDatabase will reload the page, so we won't reach here
    } catch (error) {
      console.error("Failed to reset database:", error);
      setIsResetting(false);
    }
  };

  // Note: We don't provide a cancel option because the database is corrupted
  // and the user needs to reset it to continue using the app
  const handleCancel = () => {
    // Do nothing - user must reset to recover
    // This is intentionally a no-op to prevent dismissing without action
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Database Error Detected"
      message="The local database appears to be corrupted and cannot be read. This can happen due to browser issues or incomplete updates."
      details={
        <div className="space-y-3">
          {errorMessage && (
            <p className="text-red-400/80 font-mono text-xs break-all">
              Error: {errorMessage}
            </p>
          )}
          <p>
            To recover, the database needs to be reset. This will:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Delete all locally stored character sets</li>
            <li>Reload the page to reinitialize the database</li>
            <li>Restore built-in character sets automatically</li>
          </ul>
          <p className="text-retro-amber">
            Any custom character sets you created will be lost. Consider exporting
            important work before this happens.
          </p>
        </div>
      }
      confirmLabel={isResetting ? "Resetting..." : "Reset Database"}
      cancelLabel="Keep Trying"
      variant="danger"
      onConfirm={handleReset}
      onCancel={handleCancel}
    />
  );
}
