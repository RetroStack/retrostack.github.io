"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import {
  encodeCharacterSet,
  createShareUrl,
  canShare,
  getUrlLengthStatus,
} from "@/lib/character-editor/storage/sharing";

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  description: string;
  characters: Character[];
  config: CharacterSetConfig;
}

/**
 * Modal for sharing character sets via URL
 */
export function ShareModal({
  isOpen,
  onClose,
  name,
  description,
  characters,
  config,
}: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if sharing is possible
  const shareStatus = canShare(characters.length, config.width, config.height);

  // Generate share URL when modal opens
  useEffect(() => {
    if (!isOpen || !shareStatus.canShare) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset on close
      setShareUrl(null);
      return;
    }

    try {
      const encoded = encodeCharacterSet(name, description, characters, config);
      const url = createShareUrl(encoded);
      setShareUrl(url);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate share URL");
      setShareUrl(null);
    }
  }, [isOpen, name, description, characters, config, shareStatus.canShare]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  if (!isOpen) return null;

  const urlStatus = shareUrl ? getUrlLengthStatus(shareUrl) : "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-retro-grid/30">
          <div>
            <h2 className="text-lg font-medium text-white">Share Character Set</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Share via URL - no account needed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Character set info */}
          <div className="mb-4 p-3 bg-retro-dark/50 rounded border border-retro-grid/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-retro-cyan/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-retro-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm text-white font-medium truncate">{name}</h3>
                <p className="text-xs text-gray-500">
                  {characters.length} characters | {config.width}x{config.height} px
                </p>
              </div>
            </div>
          </div>

          {/* Error state */}
          {!shareStatus.canShare && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm text-red-400">{shareStatus.message}</p>
                  <p className="text-xs text-red-400/70 mt-1">
                    Try exporting to a file instead, or reduce the number of characters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning state */}
          {shareStatus.canShare && urlStatus === "warning" && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm text-yellow-400">Long URL Warning</p>
                  <p className="text-xs text-yellow-400/70 mt-1">
                    This URL may not work on all platforms (email, social media). Consider exporting to a file for reliability.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error generating URL */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Share URL */}
          {shareUrl && (
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Share URL</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="w-full h-full px-3 py-2 pr-20 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white font-mono truncate focus:outline-none focus:border-retro-cyan"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  {/* Gradient fade for URL text before character counter */}
                  <div className="absolute top-0 bottom-0 right-0 w-20 pointer-events-none bg-gradient-to-r from-transparent via-retro-dark/80 to-retro-dark" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {shareUrl.length} chars
                  </span>
                </div>
                <Button
                  onClick={handleCopy}
                  variant="cyan"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="mt-4 p-3 bg-retro-dark/30 rounded border border-retro-grid/20">
            <h4 className="text-xs font-medium text-gray-400 mb-2">How sharing works</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-retro-cyan">1.</span>
                Your character set is encoded into the URL
              </li>
              <li className="flex items-start gap-2">
                <span className="text-retro-cyan">2.</span>
                Anyone with the link can view and import it
              </li>
              <li className="flex items-start gap-2">
                <span className="text-retro-cyan">3.</span>
                No data is stored on any server
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-retro-grid/30 bg-retro-dark/30">
          <Button onClick={onClose} variant="ghost" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
