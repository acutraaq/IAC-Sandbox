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
      className={`rounded-xl border border-border bg-surface p-6 transition-all ${
        hoverable
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
