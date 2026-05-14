interface MonoSectionHeaderProps {
  title: string;          // rendered as: ## {title}
  description?: string;   // sans, muted, below
  rightSlot?: React.ReactNode;
}

export function MonoSectionHeader({ title, description, rightSlot }: MonoSectionHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-mono text-base font-medium text-text">
          <span className="text-text-faint">## </span>
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-[65ch] text-sm text-text-muted">{description}</p>
        )}
      </div>
      {rightSlot}
    </div>
  );
}
