"use client";

import { useState, useCallback, useRef } from "react";
import { isValidBinaryFile, formatFileSize } from "@/lib/character-editor/utils";

export interface ImportDropZoneProps {
  /** Callback when a file is selected */
  onFileSelect: (file: File, data: ArrayBuffer) => void;
  /** Currently selected file */
  selectedFile?: File | null;
  /** Whether the component is in a loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Drag-and-drop file upload zone for binary ROM files
 */
export function ImportDropZone({
  onFileSelect,
  selectedFile,
  loading = false,
  error = null,
  className = "",
}: ImportDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayError = error || localError;

  const handleFile = useCallback(
    async (file: File) => {
      setLocalError(null);

      // Validate file type
      if (!isValidBinaryFile(file)) {
        setLocalError(
          "Invalid file type. Please select a binary ROM file (.bin, .rom, .chr, .fnt, .dat)"
        );
        return;
      }

      // Validate file size (max 1MB for character ROMs)
      if (file.size > 1024 * 1024) {
        setLocalError("File too large. Maximum size is 1MB.");
        return;
      }

      // Read file
      try {
        const data = await file.arrayBuffer();
        onFileSelect(file, data);
      } catch {
        setLocalError("Failed to read file. Please try again.");
      }
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".bin,.rom,.chr,.fnt,.dat"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Drop a ROM file or click to browse"
        className={`
          relative flex flex-col items-center justify-center
          p-8 sm:p-12
          border-2 border-dashed rounded-lg
          cursor-pointer
          transition-all
          ${
            isDragging
              ? "border-retro-cyan bg-retro-cyan/10"
              : selectedFile
              ? "border-retro-pink/50 bg-retro-pink/5"
              : "border-retro-grid/50 hover:border-retro-cyan/50 bg-retro-navy/30"
          }
          ${displayError ? "border-red-500/50 bg-red-500/5" : ""}
          ${loading ? "pointer-events-none opacity-50" : ""}
        `}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Reading file...</span>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            {/* File icon */}
            <div className="w-16 h-16 rounded-lg bg-retro-pink/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-retro-pink"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>

            {/* File info */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-200 truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>

            {/* Change file link */}
            <button
              type="button"
              className="text-xs text-retro-cyan hover:text-retro-pink transition-colors"
            >
              Choose a different file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Upload icon */}
            <div className="w-16 h-16 rounded-full bg-retro-purple/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-retro-pink"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {/* Instructions */}
            <div className="text-center">
              <p className="text-sm text-gray-300">
                Drag and drop a ROM file here
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or click to browse
              </p>
            </div>

            {/* Accepted formats */}
            <div className="text-[10px] text-gray-500">
              Accepts: .bin, .rom, .chr, .fnt, .dat
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {displayError && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
