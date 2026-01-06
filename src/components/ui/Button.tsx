import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "pink" | "cyan" | "violet" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  pink: "btn-neon btn-neon-pink",
  cyan: "btn-neon btn-neon-cyan",
  violet: "btn-neon btn-neon-violet",
  ghost: "bg-transparent text-retro-cyan hover:text-retro-pink transition-colors",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "pink", size = "md", children, href, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-ui font-semibold uppercase tracking-wider rounded transition-all duration-300";
    const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    if (href) {
      return (
        <a href={href} className={styles}>
          {children}
        </a>
      );
    }

    return (
      <button ref={ref} className={styles} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
