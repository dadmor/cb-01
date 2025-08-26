// src/components/ui/Input.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  compact?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon: Icon,
  error,
  compact = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-zinc-500 mb-1" style={{ fontSize: '10px' }}>
          {label.toUpperCase()}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
        )}
        <input
          className={`
            w-full bg-zinc-950 border text-zinc-200 text-xs
            focus:border-zinc-600 focus:outline-none transition-colors
            ${compact ? 'px-2 py-0.5' : 'px-2 py-1'}
            ${Icon ? 'pl-7' : ''}
            ${error ? 'border-red-600' : 'border-zinc-800'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-red-500" style={{ fontSize: '10px' }}>
          {error}
        </p>
      )}
    </div>
  );
};

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
  compact?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  compact = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-zinc-500 mb-1" style={{ fontSize: '10px' }}>
          {label.toUpperCase()}
        </label>
      )}
      <select
        className={`
          w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs
          focus:border-zinc-600 focus:outline-none transition-colors
          ${compact ? 'px-2 py-0.5' : 'px-2 py-1'}
          ${className}
        `}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Number Input with +/- buttons
interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  unit?: string;
  compact?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  unit,
  value,
  compact = false,
  onChange,
  onIncrement,
  onDecrement,
  ...props
}) => {
  const handleIncrement = () => {
    if (onIncrement) {
      onIncrement();
    } else if (onChange) {
      const newValue = (parseFloat(String(value)) || 0) + 1;
      onChange({ target: { value: String(newValue) } } as any);
    }
  };

  const handleDecrement = () => {
    if (onDecrement) {
      onDecrement();
    } else if (onChange) {
      const newValue = (parseFloat(String(value)) || 0) - 1;
      onChange({ target: { value: String(newValue) } } as any);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-zinc-500 mb-1" style={{ fontSize: '10px' }}>
          {label.toUpperCase()}
        </label>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrement}
          className="w-6 h-6 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 flex items-center justify-center transition-colors"
        >
          <span className="text-xs">−</span>
        </button>
        <input
          type="number"
          value={value}
          onChange={onChange}
          className={`
            flex-1 bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs text-center
            focus:border-zinc-600 focus:outline-none transition-colors
            ${compact ? 'px-1 py-0.5' : 'px-2 py-1'}
          `}
          {...props}
        />
        <button
          type="button"
          onClick={handleIncrement}
          className="w-6 h-6 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 flex items-center justify-center transition-colors"
        >
          <span className="text-xs">+</span>
        </button>
        {unit && (
          <span className="text-zinc-600 text-xs ml-1">{unit}</span>
        )}
      </div>
    </div>
  );
};

// Slider Component
interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  unit,
  onChange
}) => {
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-zinc-500" style={{ fontSize: '10px' }}>
            {label.toUpperCase()}
          </label>
          <span className="text-zinc-400 text-xs">
            {value}{unit}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #ea580c 0%, #ea580c ${((value - min) / (max - min)) * 100}%, #27272a ${((value - min) / (max - min)) * 100}%, #27272a 100%)`
        }}
      />
    </div>
  );
};