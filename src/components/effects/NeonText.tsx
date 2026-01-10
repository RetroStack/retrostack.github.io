/**
 * Neon Text Effect
 *
 * A typography component that applies neon-style glow effects to text.
 * Features:
 * - Multiple color options: pink, cyan, violet, amber
 * - Optional pulse animation
 * - Optional glow effect (on by default)
 * - Polymorphic component supporting multiple HTML tags
 *
 * Styles are defined in globals.css using CSS classes like neon-pink, neon-glow-cyan, etc.
 *
 * @module components/effects/NeonText
 *
 * @example
 * ```tsx
 * <NeonText as="h1" color="pink" glow>
 *   RetroStack
 * </NeonText>
 * ```
 */
import { HTMLAttributes } from "react";

type NeonColor = "pink" | "cyan" | "violet" | "amber";

interface NeonTextProps extends HTMLAttributes<HTMLElement> {
  color?: NeonColor;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
  pulse?: boolean;
  glow?: boolean;
}

const colorStyles: Record<NeonColor, string> = {
  pink: "neon-pink",
  cyan: "neon-cyan",
  violet: "neon-violet",
  amber: "neon-amber",
};

const glowStyles: Record<NeonColor, string> = {
  pink: "neon-glow-pink",
  cyan: "neon-glow-cyan",
  violet: "neon-glow-violet",
  amber: "neon-glow-amber",
};

export function NeonText({
  className = "",
  color = "pink",
  as: Tag = "span",
  pulse = false,
  glow = true,
  children,
  ...props
}: NeonTextProps) {
  const pulseStyles = pulse ? "animate-pulse" : "";
  const glowAnimation = glow ? glowStyles[color] : "";

  return (
    <Tag className={`${colorStyles[color]} ${pulseStyles} ${glowAnimation} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
