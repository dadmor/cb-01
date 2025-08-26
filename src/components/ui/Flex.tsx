// src/components/ui/Flex.tsx
import React from "react";

type Direction = "row" | "col";

interface FlexContainerProps {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  /** dodaje `flex-1` gdy true */
  flex?: boolean;
  /** dodaje `h-full` gdy true */
  fullHeight?: boolean;
}

export const FlexContainer: React.FC<FlexContainerProps> = ({
  children,
  className = "",
  direction = "row",
  flex = false,
  fullHeight = false,
}) => {
  return (
    <div
      className={[
        "flex",
        direction === "col" ? "flex-col" : "flex-row",
        flex ? "flex-1" : "",
        fullHeight ? "h-full" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
};
