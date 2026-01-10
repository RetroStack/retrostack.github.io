/**
 * Container Component
 *
 * Responsive container with max-width constraints and consistent padding.
 * Used to wrap page content and maintain readable line lengths.
 *
 * Sizes:
 * - narrow: max-w-4xl (768px) - focused content
 * - default: max-w-7xl (1280px) - standard pages
 * - wide: max-w-[1600px] - wide layouts
 * - full: no max-width
 *
 * @module components/ui/Container
 */
import { HTMLAttributes, forwardRef } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "default" | "narrow" | "wide" | "full";
  padding?: "default" | "compact" | "none";
}

const sizeStyles = {
  narrow: "max-w-4xl",
  default: "max-w-7xl",
  wide: "max-w-[1600px]",
  full: "max-w-none",
};

const paddingStyles = {
  default: "px-3 sm:px-4 md:px-6 lg:px-8",
  compact: "px-2 sm:px-3 md:px-4",
  none: "",
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className = "", size = "default", padding = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mx-auto w-full ${paddingStyles[padding]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";
