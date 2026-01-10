/**
 * Modal State Management Hook
 *
 * Manages multiple modal states with single-modal enforcement - only one
 * modal can be open at a time. Opening a new modal automatically closes
 * any existing one.
 *
 * Replaces multiple individual useState calls for modals with a cleaner,
 * type-safe API that prevents modal overlap issues.
 *
 * @module hooks/useModalManager
 *
 * @example
 * type EditorModal = 'settings' | 'export' | 'help';
 * const modals = useModalManager<EditorModal>();
 * modals.open('settings');
 * modals.isOpen('settings'); // true
 */
"use client";

import { useState, useCallback, useMemo } from "react";

/**
 * Result of the useModalManager hook
 */
export interface UseModalManagerResult<K extends string> {
  /** Check if a specific modal is open */
  isOpen: (key: K) => boolean;
  /** Open a specific modal (closes any other open modal first) */
  open: (key: K) => void;
  /** Close a specific modal */
  close: (key: K) => void;
  /** Close all modals */
  closeAll: () => void;
  /** The currently active modal key, or null if none open */
  activeModal: K | null;
}

/**
 * Hook for managing multiple modal states with single-modal enforcement.
 * Only one modal can be open at a time - opening a new modal closes any existing one.
 *
 * This hook is designed to replace multiple individual useState calls for modals,
 * providing a cleaner API and enforcing that modals don't overlap.
 *
 * @example
 * ```tsx
 * type EditorModal = 'settings' | 'export' | 'help' | 'confirm';
 *
 * function Editor() {
 *   const modals = useModalManager<EditorModal>();
 *
 *   return (
 *     <div>
 *       <button onClick={() => modals.open('settings')}>Settings</button>
 *       <button onClick={() => modals.open('export')}>Export</button>
 *       <button onClick={() => modals.open('help')}>Help</button>
 *
 *       {modals.isOpen('settings') && (
 *         <SettingsModal onClose={() => modals.close('settings')} />
 *       )}
 *       {modals.isOpen('export') && (
 *         <ExportModal onClose={() => modals.close('export')} />
 *       )}
 *       {modals.isOpen('help') && (
 *         <HelpModal onClose={() => modals.close('help')} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With initial modal open
 * const modals = useModalManager<'intro' | 'settings'>({ initialModal: 'intro' });
 * ```
 *
 * @param options - Optional configuration
 * @param options.initialModal - Modal to open initially
 * @returns Modal manager object with isOpen, open, close, closeAll, and activeModal
 */
export function useModalManager<K extends string>(options?: {
  initialModal?: K;
}): UseModalManagerResult<K> {
  const [activeModal, setActiveModal] = useState<K | null>(options?.initialModal ?? null);

  const isOpen = useCallback(
    (key: K): boolean => {
      return activeModal === key;
    },
    [activeModal],
  );

  const open = useCallback((key: K): void => {
    setActiveModal(key);
  }, []);

  const close = useCallback(
    (key: K): void => {
      // Only close if this modal is actually open
      setActiveModal((current) => (current === key ? null : current));
    },
    [],
  );

  const closeAll = useCallback((): void => {
    setActiveModal(null);
  }, []);

  // Memoize the result object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      isOpen,
      open,
      close,
      closeAll,
      activeModal,
    }),
    [isOpen, open, close, closeAll, activeModal],
  );
}

/**
 * Type helper for defining modal keys as a union type.
 * Use this when you want TypeScript to enforce valid modal keys.
 *
 * @example
 * ```tsx
 * // Define modal keys for your component
 * type MyModals = ModalKeys<'settings' | 'export' | 'help'>;
 *
 * // Use in component
 * const modals = useModalManager<MyModals>();
 * modals.open('settings'); // OK
 * modals.open('invalid'); // Type error!
 * ```
 */
export type ModalKeys<T extends string> = T;
