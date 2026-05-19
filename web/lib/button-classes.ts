export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline-glow";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-primary hover:bg-accent-hover active:scale-[0.98]",
  secondary:
    "border border-border bg-transparent text-text hover:bg-surface-elevated active:scale-[0.98]",
  ghost:
    "bg-transparent text-text-muted hover:text-text hover:bg-surface-elevated active:scale-[0.98]",
  "outline-glow":
    "border border-border-glow bg-transparent text-accent hover:bg-accent-glow hover:text-accent-hover active:scale-[0.98] glow-border hover:glow-border-hover",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-10 text-base",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 no-underline";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
): string {
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${extra ?? ""}`;
}
