"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import {
  ChangeLogEntry,
  getOperationDisplayName,
  getOperationColor,
  getOperationIcon,
} from "@/hooks/character-editor/useChangeLog";

export interface ChangeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: ChangeLogEntry[];
  onClear: () => void;
  onExport: () => string;
}

/**
 * Format a relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
}

/**
 * Format a timestamp for display
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Modal for viewing the change log
 */
export function ChangeLogModal({
  isOpen,
  onClose,
  entries,
  onClear,
  onExport,
}: ChangeLogModalProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle export
  const handleExport = useCallback(() => {
    const text = onExport();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [onExport]);

  // Handle clear
  const handleClear = useCallback(() => {
    onClear();
    setShowConfirmClear(false);
  }, [onClear]);

  if (!isOpen) return null;

  // Group entries by date
  const groupedEntries = entries.reduce<Record<string, ChangeLogEntry[]>>((acc, entry) => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-retro-grid/30">
          <div>
            <h2 className="text-lg font-medium text-white">Change Log</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {entries.length} {entries.length === 1 ? "entry" : "entries"} in this session
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              variant="ghost"
              size="sm"
              disabled={entries.length === 0}
            >
              {copied ? "Copied!" : "Copy Log"}
            </Button>
            {showConfirmClear ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  className="px-2 py-1 text-xs bg-red-500/20 border border-red-500 rounded text-red-400 hover:bg-red-500/30"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-2 py-1 text-xs border border-retro-grid/50 rounded text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <Button
                onClick={() => setShowConfirmClear(true)}
                variant="ghost"
                size="sm"
                disabled={entries.length === 0}
              >
                Clear
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-sm">No changes logged yet</p>
              <p className="text-xs mt-1">Your editing activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEntries).map(([date, dateEntries]) => (
                <div key={date}>
                  <div className="sticky top-0 bg-retro-navy/95 backdrop-blur-sm py-1 mb-2">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {date === new Date().toLocaleDateString() ? "Today" : date}
                    </h3>
                  </div>
                  <div className="relative pl-6 border-l border-retro-grid/30">
                    {dateEntries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`relative mb-4 ${index === dateEntries.length - 1 ? "mb-0" : ""}`}
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 ${
                            index === 0 && date === new Date().toLocaleDateString()
                              ? "border-retro-cyan bg-retro-cyan/20"
                              : "border-retro-grid/50 bg-retro-dark"
                          }`}
                        />

                        {/* Entry content */}
                        <div className="bg-retro-dark/30 rounded border border-retro-grid/20 p-3 hover:border-retro-grid/40 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {/* Operation icon */}
                              <span className={getOperationColor(entry.type)}>
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={getOperationIcon(entry.type)}
                                  />
                                </svg>
                              </span>
                              {/* Operation type badge */}
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${getOperationColor(
                                  entry.type
                                )} bg-current/10`}
                              >
                                {getOperationDisplayName(entry.type)}
                              </span>
                            </div>
                            {/* Timestamp */}
                            <span className="text-xs text-gray-500" title={formatTimestamp(entry.timestamp)}>
                              {formatRelativeTime(entry.timestamp)}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-300 mt-2">{entry.description}</p>

                          {/* Affected characters */}
                          {entry.affectedIndices.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {entry.affectedIndices.slice(0, 10).map((index) => (
                                <span
                                  key={index}
                                  className="text-xs px-1.5 py-0.5 rounded bg-retro-dark border border-retro-grid/30 text-gray-400"
                                >
                                  #{index}
                                </span>
                              ))}
                              {entry.affectedIndices.length > 10 && (
                                <span className="text-xs px-1.5 py-0.5 text-gray-500">
                                  +{entry.affectedIndices.length - 10} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Details */}
                          {entry.details && (
                            <p className="text-xs text-gray-500 mt-2 italic">{entry.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with stats */}
        {entries.length > 0 && (
          <div className="p-3 border-t border-retro-grid/30 bg-retro-dark/30">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Session started:{" "}
                {entries.length > 0
                  ? new Date(entries[entries.length - 1].timestamp).toLocaleTimeString()
                  : "N/A"}
              </span>
              <span>
                Last change:{" "}
                {entries.length > 0 ? formatRelativeTime(entries[0].timestamp) : "N/A"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
