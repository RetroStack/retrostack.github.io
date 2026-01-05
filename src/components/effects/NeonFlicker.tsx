"use client";

import { useState, useEffect, useMemo } from "react";

interface NeonFlickerProps {
  /** Text to display with flicker effect */
  text: string;
  /** Base color class (neon-pink, neon-cyan, neon-violet) */
  color?: "pink" | "cyan" | "violet";
  /** Additional className */
  className?: string;
  /** HTML element to render */
  as?: "span" | "h1" | "h2" | "h3" | "div";
  /** Characters that should flicker (default: only specific letters) */
  flickerChars?: Record<string, "often" | "sometimes" | "seldom">;
}

/**
 * Default flicker configuration for a realistic neon sign
 * Most letters are stable, only a few have issues
 */
const DEFAULT_FLICKER_CHARS: Record<string, "often" | "sometimes" | "seldom"> = {
  r: "often",
  a: "sometimes",
  S: "seldom",
};

/**
 * Simple seeded random for deterministic values
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

/**
 * Neon text with subtle per-letter flicker animation
 * Creates an authentic old neon sign effect where only
 * specific letters flicker (like a real aging neon sign)
 */
export function NeonFlicker({
  text,
  color = "pink",
  className = "",
  as: Tag = "span",
  flickerChars = DEFAULT_FLICKER_CHARS,
}: NeonFlickerProps) {
  const [mounted, setMounted] = useState(false);

  // Set mounted after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate animation values only for characters that should flicker
  const letters = useMemo(() => {
    return text.split("").map((char, index) => {
      const flickerType = flickerChars[char];
      const shouldFlicker = !!flickerType;

      if (!shouldFlicker) {
        return { char, shouldFlicker: false, delay: 0, duration: 0 };
      }

      // Use seeded random for deterministic server/client values
      const seed1 = index * 17 + text.length;
      const seed2 = index * 31 + text.length * 7;

      // Adjust timing based on flicker frequency
      let delayMultiplier = 1;
      let durationBase = 4;

      switch (flickerType) {
        case "often":
          // Flickers frequently with shorter pauses
          delayMultiplier = 0.5;
          durationBase = 2;
          break;
        case "sometimes":
          // Moderate flickering
          delayMultiplier = 1;
          durationBase = 4;
          break;
        case "seldom":
          // Rare flickering with long pauses
          delayMultiplier = 2;
          durationBase = 6;
          break;
      }

      return {
        char,
        shouldFlicker: true,
        // Deterministic delay
        delay: seededRandom(seed1) * 10 * delayMultiplier,
        // Deterministic duration
        duration: durationBase + seededRandom(seed2) * 3,
      };
    });
  }, [text, flickerChars]);

  const colorClass = `neon-${color}`;

  return (
    <Tag className={`neon-flicker-container ${className}`}>
      {letters.map((letter, index) => (
        <span
          key={index}
          className={`${letter.shouldFlicker ? "neon-flicker-letter" : ""} ${colorClass}`}
          style={
            mounted && letter.shouldFlicker
              ? {
                  animationDelay: `${letter.delay}s`,
                  animationDuration: `${letter.duration}s`,
                }
              : undefined
          }
        >
          {letter.char === " " ? "\u00A0" : letter.char}
        </span>
      ))}
    </Tag>
  );
}
