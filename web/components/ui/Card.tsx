"use client";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glow?: boolean;
}

export function Card({
  hoverable = false,
  glow = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const glowClasses = glow
    ? "glow-border-hover"
    : "";

  return (
    <div
      className={`rounded-xl border border-border bg-surface transition-all duration-150 ${
        hoverable
          ? `cursor-pointer hover:border-border-strong hover:bg-surface-elevated ${glowClasses}`
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
