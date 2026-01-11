/**
 * Tip Item Component
 *
 * Displays a single tip with title, description, optional keyboard shortcut,
 * and optional image.
 *
 * @module components/character-editor/help/TipItem
 */
"use client";

import Image from "next/image";
import { Tip } from "@/lib/character-editor/tips/types";

export interface TipItemProps {
  /** Tip data */
  tip: Tip;
}

/**
 * Individual tip display component
 */
export function TipItem({ tip }: TipItemProps) {
  return (
    <div className="py-3 px-2 rounded hover:bg-retro-purple/10 transition-colors">
      {/* Title with optional shortcut */}
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="text-sm font-medium text-white">{tip.title}</h4>
        {tip.shortcut && (
          <kbd className="px-2 py-0.5 text-xs font-mono bg-retro-dark border border-retro-grid/50 rounded text-gray-400">
            {tip.shortcut}
          </kbd>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mt-1 leading-relaxed">{tip.description}</p>

      {/* Optional image */}
      {tip.image && (
        <div className="mt-3">
          <Image
            src={tip.image}
            alt={tip.imageAlt || tip.title}
            width={400}
            height={200}
            className="rounded border border-retro-grid/30 max-w-full h-auto"
          />
        </div>
      )}
    </div>
  );
}

TipItem.displayName = "TipItem";
