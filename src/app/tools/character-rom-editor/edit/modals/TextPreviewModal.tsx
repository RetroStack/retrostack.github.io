"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Character, CharacterSetConfig } from "@/lib/character-editor/types";
import { CustomColors } from "@/lib/character-editor/data/colorPresets";
import { ColorPresetSelector } from "@/components/character-editor/selectors/ColorPresetSelector";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@/components/ui/Modal";
import { CRTEffectsOverlay } from "@/components/character-editor/editor/CRTEffectsOverlay";
import { CRTEffectsPanel } from "@/components/character-editor/editor/CRTEffectsPanel";
import { CRTSettings, getCRTSettings, saveCRTSettings } from "@/lib/character-editor/data/crtSettings";

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

/** Sample text presets - "All Characters" is added dynamically based on character count */
const SAMPLE_TEXTS = [
  { label: "Quick Fox", text: "The quick brown fox jumps over the lazy dog." },
  { label: "Hello World", text: "HELLO WORLD!\nHello World!\nhello world!" },
  { label: "Numbers", text: "0123456789\nABCDEF abcdef" },
  { label: "Symbols", text: "!@#$%^&*()_+-=[]{}\\|;':\",./<>?" },
  { label: "ASCII Art", text: "+------------------+\n|  RETRO COMPUTER  |\n+------------------+" },
];

/**
 * Generates text containing all characters from index 0 to count-1
 * Uses character codes directly, displaying 16 characters per line
 */
function generateAllCharactersText(count: number): string {
  const lines: string[] = [];
  const charsPerLine = 16;

  for (let i = 0; i < count; i += charsPerLine) {
    let line = "";
    for (let j = i; j < Math.min(i + charsPerLine, count); j++) {
      // Use character codes directly - the index shift will map these to the right characters
      line += String.fromCharCode(j);
    }
    lines.push(line);
  }
  return lines.join("\n");
}

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
  bloomIntensity = 0,
}: {
  character: Character | null;
  scale: number;
  foregroundColor: string;
  backgroundColor: string;
  /** Bloom intensity 0-100, 0 means no bloom */
  bloomIntensity?: number;
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

    // Set up bloom effect (pixel glow) based on intensity
    if (bloomIntensity > 0) {
      ctx.shadowColor = foregroundColor;
      // Map intensity 0-100 to blur radius 0-2 (scaled by pixel size)
      ctx.shadowBlur = (bloomIntensity / 100) * scale * 2;
    }

    // Draw pixels
    ctx.fillStyle = foregroundColor;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (character.pixels[y]?.[x]) {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }, [character, scale, foregroundColor, backgroundColor, bloomIntensity]);

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
  const [text, setText] = useState("");
  const [scale, setScale] = useState(2);
  const [localColors, setLocalColors] = useState<CustomColors>(initialColors);
  const [crtSettings, setCrtSettings] = useState<CRTSettings>(() => getCRTSettings());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle CRT settings change and persist
  const handleCrtSettingsChange = useCallback((settings: CRTSettings) => {
    setCrtSettings(settings);
    saveCRTSettings(settings);
  }, []);

  // Generate "All Characters" text based on character count
  const allCharactersText = useMemo(() => {
    return generateAllCharactersText(characters.length);
  }, [characters.length]);

  // Set default text to "All Characters" when modal opens
  useEffect(() => {
    if (isOpen) {
      setText(allCharactersText);
    }
  }, [isOpen, allCharactersText]);

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

  // Convert text to character indices (direct mapping by char code)
  const renderedLines = useMemo(() => {
    const lines = text.split("\n");
    return lines.map((line) => {
      const chars: (Character | null)[] = [];
      for (const char of line) {
        const code = char.charCodeAt(0);
        if (code >= 0 && code < characters.length) {
          chars.push(characters[code]);
        } else {
          // Use first character as fallback for out-of-range
          chars.push(characters[0] || null);
        }
      }
      return chars;
    });
  }, [text, characters]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" maxHeight="90vh">
      <ModalHeader onClose={onClose} showCloseButton>
        <h2 className="text-lg font-medium text-white">Text Preview</h2>
      </ModalHeader>

      <ModalContent scrollable className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left side - Input */}
          <div className="space-y-4">
            {/* Text input */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Enter text to preview</label>
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
              <label className="block text-sm text-gray-300 mb-2">Sample texts</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setText(allCharactersText)}
                  className="px-2 py-1 text-xs bg-retro-dark border border-retro-pink/30 rounded text-retro-pink/70 hover:text-retro-pink hover:border-retro-pink/50 transition-colors"
                  title={`Show all ${characters.length} characters`}
                >
                  All Characters
                </button>
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

            {/* CRT Effects */}
            <CRTEffectsPanel settings={crtSettings} onChange={handleCrtSettingsChange} defaultCollapsed={false} />
          </div>

          {/* Right side - Preview */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Preview</label>
            <CRTEffectsOverlay
              settings={crtSettings}
              foregroundColor={localColors.foreground}
              className="rounded border border-retro-grid/30 overflow-auto max-h-[500px]"
            >
              <div className="p-4" style={{ backgroundColor: localColors.background }}>
                {renderedLines.length === 0 || (renderedLines.length === 1 && renderedLines[0].length === 0) ? (
                  <div className="text-xs text-gray-500 italic">Type something to see the preview...</div>
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
                              bloomIntensity={crtSettings.bloom ? crtSettings.bloomIntensity : 0}
                            />
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CRTEffectsOverlay>
            <div className="mt-2 text-xs text-gray-500">
              {text.length} characters, {renderedLines.length} lines
            </div>
          </div>
        </div>
      </ModalContent>

      <ModalFooter className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Colors:</span>
          <ColorPresetSelector colors={localColors} onColorsChange={setLocalColors} dropUp />
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
      </ModalFooter>
    </Modal>
  );
}
