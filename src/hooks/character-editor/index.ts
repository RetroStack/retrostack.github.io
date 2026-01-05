/**
 * Character ROM Editor - Hook Exports
 */

export { useCharacterLibrary } from "./useCharacterLibrary";
export type { UseCharacterLibraryResult } from "./useCharacterLibrary";

export { useCharacterEditor } from "./useCharacterEditor";
export type { UseCharacterEditorResult, EditorState } from "./useCharacterEditor";

export { useUndoRedo, deepClone } from "./useUndoRedo";
export type { UseUndoRedoResult } from "./useUndoRedo";

export {
  useKeyboardShortcuts,
  formatShortcut,
  createEditorShortcuts,
} from "./useKeyboardShortcuts";
export type {
  KeyboardShortcut,
  UseKeyboardShortcutsOptions,
} from "./useKeyboardShortcuts";

export { useAutoSave } from "./useAutoSave";
export type {
  AutoSaveData,
  UseAutoSaveOptions,
  UseAutoSaveResult,
} from "./useAutoSave";

export { useSnapshots } from "./useSnapshots";
export type {
  UseSnapshotsOptions,
  UseSnapshotsResult,
} from "./useSnapshots";

export {
  useChangeLog,
  getOperationDisplayName,
  getOperationColor,
  getOperationIcon,
} from "./useChangeLog";
export type {
  ChangeOperationType,
  ChangeLogEntry,
  UseChangeLogOptions,
  UseChangeLogResult,
} from "./useChangeLog";
