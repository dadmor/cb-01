// ------ src/components/ui/Layout.tsx ------
import { Panel } from "./Panel";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '' }) => (
  <div className={`flex h-full ${className}`}>
    {children}
  </div>
);

export const Canvas: React.FC<ContainerProps> = ({ children, className = '' }) => (
  <div className={`flex-1 bg-gradient-to-br from-neutral-950 via-black to-neutral-950 ${className}`}>
    {children}
  </div>
);

interface LayoutSidebarProps extends ContainerProps {
  width?: string;
}

export const LayoutSidebar: React.FC<LayoutSidebarProps> = ({ 
  children, 
  width = 'w-96',
  className = '' 
}) => (
  <Panel className={`${width} border-l border-neutral-800 ${className}`}>
    {children}
  </Panel>
);

// ------ src/components/ui/NumberInput.tsx ------
import React from 'react';

interface NumberInputProps {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  placeholder, 
  disabled = false 
}) => {
  const numValue = typeof value === 'number' ? value : (parseFloat(value as string) || 0);
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-neutral-500 mb-1 text-[10px] uppercase font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => onChange(numValue - 1)}
          disabled={disabled || (min !== undefined && numValue <= min)}
          className="absolute left-0 inset-y-0 px-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 disabled:opacity-30 transition-colors"
        >
          −
        </button>
        
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          className="w-full bg-black border border-neutral-800 px-6 py-0.5 text-xs text-center text-neutral-200 focus:border-red-700 focus:outline-none disabled:opacity-30"
        />
        
        <button
          type="button"
          onClick={() => onChange(numValue + 1)}
          disabled={disabled || (max !== undefined && numValue >= max)}
          className="absolute right-0 inset-y-0 px-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 disabled:opacity-30 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
};