// src/components/ui/NumberInput.tsx
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
        <label className="block text-zinc-500 mb-1 text-[10px] uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => onChange(numValue - 1)}
          disabled={disabled || (min !== undefined && numValue <= min)}
          className="absolute left-0 inset-y-0 px-1.5 text-zinc-500 hover:bg-zinc-800 disabled:opacity-50"
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
          className="w-full bg-zinc-950 border border-zinc-800 px-6 py-0.5 text-xs text-center text-zinc-200 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
        />
        
        <button
          type="button"
          onClick={() => onChange(numValue + 1)}
          disabled={disabled || (max !== undefined && numValue >= max)}
          className="absolute right-0 inset-y-0 px-1.5 text-zinc-500 hover:bg-zinc-800 disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
};