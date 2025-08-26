// ------ src/components/ui/EmptyState.tsx ------
import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
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
      {icon && <div className="mb-3 flex justify-center text-neutral-600">{icon}</div>}
      <h3 className="text-sm text-neutral-300 font-medium">{title}</h3>
      {description && (
        <p className="text-xs text-neutral-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};