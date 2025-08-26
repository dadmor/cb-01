// ------ src/components/ui/Card.tsx ------
import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  selected?: boolean;
  compact?: boolean;
  className?: string;
  onClose?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  selected,
  compact = false,
  className = "",
  onClose,
}) => (
  <div
    className={`
      bg-neutral-900 border rounded-sm
      ${selected ? "border-red-600 shadow-lg shadow-red-900/20" : "border-neutral-800"}
      ${compact ? "p-1" : "p-2"}
      ${className}
    `}
  >
    {title && (
      <div className="h-5 bg-gradient-to-r from-neutral-800 to-neutral-900 border border-neutral-700 px-1 mb-1 flex items-center justify-between">
        <span className="text-xs text-neutral-400 font-medium tracking-wide">
          {title}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-200 text-xs leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    )}
    <div>{children}</div>
  </div>
);
