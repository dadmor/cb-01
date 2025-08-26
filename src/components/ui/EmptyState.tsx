// src/components/ui/EmptyState.tsx
import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Dodatkowa akcja/sekcja pod tytułem (np. <Card /> z legendą) */
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      {icon && <div className="mb-3 flex justify-center">{icon}</div>}
      <h3 className="text-sm text-zinc-200 font-medium">{title}</h3>
      {description && (
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
