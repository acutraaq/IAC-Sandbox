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
      className={`rounded-md border border-border bg-surface p-6 transition-all duration-150 ${
        hoverable
          ?           "cursor-pointer hover:border-border-strong hover:bg-surface-elevated"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
