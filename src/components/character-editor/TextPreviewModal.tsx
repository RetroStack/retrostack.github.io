"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import { CustomColors } from "@/lib/character-editor/colorPresets";
import { ColorPresetSelector } from "./ColorPresetSelector";

export interface TextPreviewModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Characters in the set */
  characters: Character[];
  /** Character set configuration */
  config: CharacterSetConfig;
  /** Colors configuration */
  colors: CustomColors;
}

/** Sample text presets */
const SAMPLE_TEXTS = [
  { label: "Quick Fox", text: "The quick brown fox jumps over the lazy dog." },
  { label: "Hello World", text: "HELLO WORLD!\nHello World!\nhello world!" },
  { label: "Numbers", text: "0123456789\nABCDEF abcdef" },
  { label: "Symbols", text: "!@#$%^&*()_+-=[]{}\\|;':\",./<>?" },
  { label: "ASCII Art", text: "+------------------+\n|  RETRO COMPUTER  |\n+------------------+" },
];

/** Scale options */
const SCALE_OPTIONS = [
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
  { value: 4, label: "4x" },
];

/**
 * Mini character renderer for the text preview
 */
function MiniCharacter({
  character,
  scale,
  foregroundColor,
  backgroundColor,
}: {
  character: Character | null;
  scale: number;
  foregroundColor: string;
  backgroundColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !character) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = character.pixels[0]?.length || 8;
    const height = character.pixels.length;

    canvas.width = width * scale;
    canvas.height = height * scale;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pixels
    ctx.fillStyle = foregroundColor;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (character.pixels[y]?.[x]) {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }, [character, scale, foregroundColor, backgroundColor]);

  if (!character) {
    return (
      <div
        style={{
          width: 8 * scale,
          height: 8 * scale,
          backgroundColor,
        }}
      />
    );
  }

  return <canvas ref={canvasRef} className="block" />;
}

/**
 * Text preview modal - type text and see it rendered with your character set
 */
export function TextPreviewModal({
  isOpen,
  onClose,
  characters,
  config,
  colors: initialColors,
}: TextPreviewModalProps) {
  const [text, setText] = useState(SAMPLE_TEXTS[0].text);
  const [scale, setScale] = useState(2);
  const [localColors, setLocalColors] = useState<CustomColors>(initialColors);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update colors when props change
  useEffect(() => {
    setLocalColors(initialColors);
  }, [initialColors]);

  // Focus textarea on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Convert text to character indices
  const renderedLines = useMemo(() => {
    const lines = text.split("\n");
    return lines.map((line) => {
      const chars: (Character | null)[] = [];
      for (const char of line) {
        const code = char.charCodeAt(0);
        // Map ASCII code to character index
        // Most character sets start at 0, but some may have different mappings
        if (code >= 0 && code < characters.length) {
          chars.push(characters[code]);
        } else {
          // Use space or first character as fallback
          chars.push(characters[32] || characters[0] || null);
        }
      }
      return chars;
    });
  }, [text, characters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-retro-grid/30">
          <h2 className="text-lg font-medium text-white">Text Preview</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left side - Input */}
            <div className="space-y-4">
              {/* Text input */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Enter text to preview
                </label>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-retro-cyan resize-none"
                  placeholder="Type your text here..."
                />
              </div>

              {/* Sample text presets */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Sample texts
                </label>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_TEXTS.map((sample) => (
                    <button
                      key={sample.label}
                      onClick={() => setText(sample.text)}
                      className="px-2 py-1 text-xs bg-retro-dark border border-retro-grid/30 rounded text-gray-400 hover:text-retro-cyan hover:border-retro-cyan/50 transition-colors"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                {/* Scale */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Scale</label>
                  <div className="flex gap-1">
                    {SCALE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setScale(option.value)}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          scale === option.value
                            ? "bg-retro-cyan/20 border border-retro-cyan text-retro-cyan"
                            : "bg-retro-dark border border-retro-grid/30 text-gray-400 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Character info */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Character Set</label>
                  <div className="text-xs text-gray-500">
                    {config.width}x{config.height} pixels, {characters.length} chars
                  </div>
                </div>
              </div>

            </div>

            {/* Right side - Preview */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Preview</label>
              <div
                className="p-4 rounded border border-retro-grid/30 overflow-auto max-h-[400px]"
                style={{ backgroundColor: localColors.background }}
              >
                {renderedLines.length === 0 || (renderedLines.length === 1 && renderedLines[0].length === 0) ? (
                  <div className="text-xs text-gray-500 italic">
                    Type something to see the preview...
                  </div>
                ) : (
                  <div className="space-y-0">
                    {renderedLines.map((line, lineIndex) => (
                      <div key={lineIndex} className="flex flex-wrap" style={{ minHeight: config.height * scale }}>
                        {line.length === 0 ? (
                          // Empty line - just show line height
                          <div style={{ height: config.height * scale, width: config.width * scale }} />
                        ) : (
                          line.map((char, charIndex) => (
                            <MiniCharacter
                              key={charIndex}
                              character={char}
                              scale={scale}
                              foregroundColor={localColors.foreground}
                              backgroundColor={localColors.background}
                            />
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {text.length} characters, {renderedLines.length} lines
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-retro-grid/30">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Colors:</span>
            <ColorPresetSelector
              colors={localColors}
              onColorsChange={setLocalColors}
              dropUp
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setText("")}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-retro-cyan/20 border border-retro-cyan rounded text-retro-cyan hover:bg-retro-cyan/30 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
