// src/components/ui/Card.tsx
import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  selected?: boolean;
  compact?: boolean;
  className?: string;
  /** Opcjonalny krzyżyk zamknięcia w prawym górnym rogu */
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
      bg-zinc-900 border rounded
      ${selected ? "border-orange-500" : "border-zinc-800"}
      ${compact ? "p-2" : "p-3"}
      ${className}
    `}
  >
    {title && (
      <div className="h-6 bg-zinc-800 border border-zinc-700 rounded-sm px-2 mb-2 flex items-center justify-between">
        <span className="text-xs text-zinc-400 uppercase tracking-wider">
          {title}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-sm leading-none"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    )}
    {/* Jeśli tytuł był, padding już był na headerze; wnętrze robi minimalny odstęp */}
    <div className={compact ? "" : ""}>{children}</div>
  </div>
);
