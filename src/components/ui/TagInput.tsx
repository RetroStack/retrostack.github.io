/**
 * TagInput Component
 *
 * A tag input that converts text to badges on comma/Enter.
 * Tags are displayed as amber badges that turn red on hover.
 *
 * Features:
 * - Press comma or Enter to create a tag
 * - Backspace removes the last tag when input is empty
 * - Click on a tag or its X button to remove it
 * - Duplicate tags are prevented (case-insensitive)
 * - Whitespace is trimmed before creating tags
 *
 * @module components/ui/TagInput
 */
"use client";

import { forwardRef, useState, useCallback, KeyboardEvent, InputHTMLAttributes } from "react";

export interface TagInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  /** Current tags array */
  tags: string[];
  /** Callback when tags change */
  onTagsChange: (tags: string[]) => void;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** ID prefix for accessibility */
  idPrefix?: string;
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
  ({ tags, onTagsChange, placeholder = "Add tags...", maxTags, idPrefix = "tag-input", className = "", ...props }, ref) => {
    const [inputValue, setInputValue] = useState("");

    const addTag = useCallback(
      (tagText: string) => {
        const trimmed = tagText.trim();
        if (!trimmed) return;

        // Check for duplicates (case-insensitive)
        const isDuplicate = tags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase());
        if (isDuplicate) return;

        // Check max tags limit
        if (maxTags && tags.length >= maxTags) return;

        onTagsChange([...tags, trimmed]);
        setInputValue("");
      },
      [tags, onTagsChange, maxTags]
    );

    const removeTag = useCallback(
      (indexToRemove: number) => {
        onTagsChange(tags.filter((_, index) => index !== indexToRemove));
      },
      [tags, onTagsChange]
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          addTag(inputValue);
        } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
          // Remove last tag when backspace is pressed on empty input
          removeTag(tags.length - 1);
        }
      },
      [inputValue, addTag, removeTag, tags.length]
    );

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // If the value ends with a comma, treat it as tag creation
      if (value.endsWith(",")) {
        const tagText = value.slice(0, -1);
        if (tagText.trim()) {
          addTag(tagText);
        }
      } else {
        setInputValue(value);
      }
    }, [addTag]);

    const canAddMore = !maxTags || tags.length < maxTags;

    return (
      <div
        className={`flex flex-wrap items-center gap-1.5 px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm focus-within:border-retro-cyan transition-colors ${className}`}
      >
        {/* Existing tags */}
        {tags.map((tag, index) => (
          <span
            key={`${idPrefix}-tag-${index}`}
            onClick={() => removeTag(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                removeTag(index);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Remove tag: ${tag}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors bg-retro-amber/20 text-retro-amber border border-retro-amber/30 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400"
          >
            {tag}
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </span>
        ))}

        {/* Input field */}
        {canAddMore && (
          <input
            ref={ref}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[100px] bg-transparent text-white placeholder-gray-500 focus:outline-none"
            id={`${idPrefix}-input`}
            {...props}
          />
        )}
      </div>
    );
  }
);

TagInput.displayName = "TagInput";
