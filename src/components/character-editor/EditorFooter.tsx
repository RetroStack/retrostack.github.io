"use client";

export interface EditorFooterProps {
  /** Current hover coordinates (null when not hovering) */
  hoverCoords?: { x: number; y: number } | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Static footer bar showing keyboard shortcuts for the editor
 * with mouse coordinates displayed on the right
 */
export function EditorFooter({ hoverCoords, className = "" }: EditorFooterProps) {
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
      className={`flex-shrink-0 flex items-center px-4 py-1.5 bg-retro-navy/50 border-t border-retro-grid/50 ${className}`}
    >
      {/* Left spacer for balance */}
      <div className="w-24 flex-shrink-0" />

      {/* Centered keyboard shortcuts */}
      <div className="flex-1 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-gray-500">
          {shortcuts.map(({ keys, action }, index) => (
            <div key={index} className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-gray-400">{keys}</span>
              <span className="hidden sm:inline">: {action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side: Mouse coordinates */}
      <div className="w-24 flex-shrink-0 flex justify-end">
        {hoverCoords && (
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-500 font-mono">
            <span className="text-gray-400">Pixel:</span>
            <span className="text-retro-cyan">({hoverCoords.x}, {hoverCoords.y})</span>
          </div>
        )}
      </div>
    </div>
  );
}
