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
  className = "",
  onClose,
}) => (
  <div
    className={`
      bg-neutral-900 border rounded-sm p-px
      ${selected ? "border-red-600 shadow-lg shadow-red-900/20" : "border-neutral-800"}

      ${className}
    `}
  >
    {title && (
      <div className=" p-3 flex items-center justify-between mb-2">
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
    <div className="p-3">{children}</div>
  </div>
);
