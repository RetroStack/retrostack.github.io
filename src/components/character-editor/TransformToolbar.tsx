"use client";

import { useCallback } from "react";

export interface TransformToolbarProps {
  /** Callback for shift operations */
  onShift: (direction: "up" | "down" | "left" | "right") => void;
  /** Callback for rotate operations */
  onRotate: (direction: "left" | "right") => void;
  /** Callback for flip horizontal */
  onFlipHorizontal: () => void;
  /** Callback for flip vertical */
  onFlipVertical: () => void;
  /** Callback for invert */
  onInvert: () => void;
  /** Callback for clear */
  onClear: () => void;
  /** Callback for fill */
  onFill: () => void;
  /** Callback for center content */
  onCenter?: () => void;
  /** Callback for scale */
  onScale?: () => void;
  /** Callback for delete */
  onDelete?: () => void;
  /** Callback for copy from current set */
  onCopy?: () => void;
  /** Whether toolbar is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Icon components for the toolbar
 */
function ArrowUpIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function RotateLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function RotateRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: "scaleX(-1)" }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function FlipHorizontalIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8m-8 5h8M4 3v18m16-18v18" />
    </svg>
  );
}

function FlipVerticalIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v8M12 8v8m5-8v8M3 4h18M3 20h18" />
    </svg>
  );
}

function InvertIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function ClearIcon({ className = "w-4 h-4" }: { className?: string }) {
  // Hollow/empty square - represents clearing to empty
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth={2} />
    </svg>
  );
}

function FillIcon({ className = "w-4 h-4" }: { className?: string }) {
  // Solid filled square - represents filling with pixels
  return (
    <svg className={className} viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}

function DeleteIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CopyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CenterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
    </svg>
  );
}

function ScaleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4l4 4m0-4H4v4m16-4l-4 4m4 0V4h-4m-12 16l4-4m-4 0v4h4m12 0l-4-4m4 0v4h-4"
      />
    </svg>
  );
}

/**
 * Toolbar button component
 */
function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
  className = "",
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded transition-colors
        ${disabled
          ? "text-gray-600 cursor-not-allowed"
          : "text-gray-400 hover:text-retro-cyan hover:bg-retro-purple/30"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * Section divider component
 */
function ToolbarDivider() {
  return <div className="w-full h-px bg-retro-grid/30 my-2" />;
}

/**
 * Section label component
 */
function ToolbarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] text-gray-500 uppercase tracking-wider text-center mb-1">
      {children}
    </div>
  );
}

/**
 * Right-side toolbar for character transform operations
 * Features a cross layout for shift buttons and grouped transform operations
 */
export function TransformToolbar({
  onShift,
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
  onInvert,
  onClear,
  onFill,
  onCenter,
  onScale,
  onDelete,
  onCopy,
  disabled = false,
  className = "",
}: TransformToolbarProps) {
  const handleShiftUp = useCallback(() => onShift("up"), [onShift]);
  const handleShiftDown = useCallback(() => onShift("down"), [onShift]);
  const handleShiftLeft = useCallback(() => onShift("left"), [onShift]);
  const handleShiftRight = useCallback(() => onShift("right"), [onShift]);
  const handleRotateLeft = useCallback(() => onRotate("left"), [onRotate]);
  const handleRotateRight = useCallback(() => onRotate("right"), [onRotate]);

  return (
    <div
      className={`
        flex flex-col items-center p-2 bg-retro-navy/50 border-l border-retro-grid/30 overflow-hidden
        ${className}
      `}
    >
      {/* Shift section with cross layout */}
      <ToolbarLabel>Shift</ToolbarLabel>
      <div className="flex flex-col items-center gap-0.5">
        {/* Up button */}
        <ToolbarButton
          onClick={handleShiftUp}
          disabled={disabled}
          title="Shift Up (W)"
        >
          <ArrowUpIcon />
        </ToolbarButton>

        {/* Left - Center - Right row */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={handleShiftLeft}
            disabled={disabled}
            title="Shift Left (A)"
          >
            <ArrowLeftIcon />
          </ToolbarButton>

          {/* Center button */}
          <ToolbarButton
            onClick={onCenter || (() => {})}
            disabled={disabled || !onCenter}
            title="Center Content"
          >
            <CenterIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={handleShiftRight}
            disabled={disabled}
            title="Shift Right (D)"
          >
            <ArrowRightIcon />
          </ToolbarButton>
        </div>

        {/* Down button */}
        <ToolbarButton
          onClick={handleShiftDown}
          disabled={disabled}
          title="Shift Down (S)"
        >
          <ArrowDownIcon />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* Rotate section */}
      <ToolbarLabel>Rotate</ToolbarLabel>
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={handleRotateLeft}
          disabled={disabled}
          title="Rotate Left (Shift+R)"
        >
          <RotateLeftIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleRotateRight}
          disabled={disabled}
          title="Rotate Right (R)"
        >
          <RotateRightIcon />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* Flip section */}
      <ToolbarLabel>Flip</ToolbarLabel>
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={onFlipHorizontal}
          disabled={disabled}
          title="Flip Horizontal (H)"
        >
          <FlipHorizontalIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={onFlipVertical}
          disabled={disabled}
          title="Flip Vertical (V)"
        >
          <FlipVerticalIcon />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      {/* Effects section */}
      <ToolbarLabel>Effects</ToolbarLabel>
      <div className="flex flex-col items-center gap-1">
        <ToolbarButton
          onClick={onInvert}
          disabled={disabled}
          title="Invert Colors (I)"
        >
          <InvertIcon />
        </ToolbarButton>
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={onClear}
            disabled={disabled}
            title="Clear"
          >
            <ClearIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={onFill}
            disabled={disabled}
            title="Fill"
          >
            <FillIcon />
          </ToolbarButton>
        </div>
      </div>

      {/* Scale section */}
      {onScale && (
        <>
          <ToolbarDivider />
          <ToolbarLabel>Scale</ToolbarLabel>
          <ToolbarButton
            onClick={onScale}
            disabled={disabled}
            title="Scale Character"
          >
            <ScaleIcon />
          </ToolbarButton>
        </>
      )}

      {/* Character section */}
      {(onCopy || onDelete) && (
        <>
          <ToolbarDivider />
          <ToolbarLabel>Char</ToolbarLabel>
          <div className="flex items-center gap-1">
            {onCopy && (
              <ToolbarButton
                onClick={onCopy}
                disabled={disabled}
                title="Copy from character set (C)"
              >
                <CopyIcon />
              </ToolbarButton>
            )}
            {onDelete && (
              <ToolbarButton
                onClick={onDelete}
                disabled={disabled}
                title="Delete character (Del)"
                className="hover:text-red-400"
              >
                <DeleteIcon />
              </ToolbarButton>
            )}
          </div>
        </>
      )}
    </div>
  );
}
