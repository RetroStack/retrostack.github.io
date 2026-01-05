"use client";

export interface EditorFooterProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Static footer bar showing keyboard shortcuts for the editor
 */
export function EditorFooter({ className = "" }: EditorFooterProps) {
  const shortcuts = [
    { keys: "Arrow keys", action: "Navigate" },
    { keys: "Click", action: "Select" },
    { keys: "Shift+Click", action: "Multi-select" },
    { keys: "Del", action: "Delete" },
    { keys: "Ctrl+S", action: "Save" },
    { keys: "Ctrl+Z/Y", action: "Undo/Redo" },
    { keys: "?", action: "Help" },
  ];

  return (
    <div
      className={`flex items-center justify-center gap-4 px-4 py-1.5 bg-retro-navy/50 border-t border-retro-grid/50 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-gray-500">
        {shortcuts.map(({ keys, action }, index) => (
          <div key={index} className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-gray-400">{keys}</span>
            <span className="hidden sm:inline">: {action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
