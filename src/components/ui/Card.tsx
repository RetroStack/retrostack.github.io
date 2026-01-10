/**
 * Card Components
 *
 * Retro-styled card with glassmorphism effect and optional hover glow.
 * Provides Card, CardHeader, CardTitle, and CardContent sub-components
 * for consistent layout.
 *
 * Used throughout the site for content sections, tool previews,
 * and library items.
 *
 * @module components/ui/Card
 */
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", hover = true, children, ...props }, ref) => {
    const baseStyles = "card-retro p-6";
    const hoverStyles = hover ? "hover-glow-pink" : "";

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`mb-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: "h2" | "h3" | "h4";
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = "", as: Tag = "h3", children, ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={`font-display text-sm text-retro-cyan ${className}`}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

CardTitle.displayName = "CardTitle";

type CardContentProps = HTMLAttributes<HTMLDivElement>;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`text-text-secondary ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";
