// src/components/ui/StatusText.tsx
import React from "react";

type Variant = "muted" | "warning" | "error" | "default";
type Size = "xs" | "sm";

interface StatusTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
}

export const StatusText: React.FC<StatusTextProps> = ({
  children,
  className = "",
  variant = "default",
  size = "sm",
}) => {
  const variantCls: Record<Variant, string> = {
    default: "text-zinc-300",
    muted: "text-zinc-500",
    warning: "text-amber-400",
    error: "text-red-400",
  };

  const sizeCls: Record<Size, string> = {
    xs: "text-xs",
    sm: "text-sm",
  };

  return (
    <span className={[variantCls[variant], sizeCls[size], className].join(" ")}>
      {children}
    </span>
  );
};
