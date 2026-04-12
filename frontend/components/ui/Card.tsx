"use client";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({
  hoverable = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-md border border-border bg-surface p-6 transition-colors ${
        hoverable
          ? "cursor-pointer hover:border-accent/25 hover:bg-surface-elevated"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
