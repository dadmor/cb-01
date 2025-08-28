// ------ src/components/ui/Input.tsx ------
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-neutral-500 mb-1 text-[10px] uppercase font-medium">
        {label}
      </label>
    )}
    <input
      className={`
        w-full bg-black border border-neutral-800 p-2
        text-neutral-200 text-xs focus:border-red-700 focus:outline-none
        placeholder-neutral-600
        ${className}
      `}
      {...props}
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-neutral-500 mb-1 text-[10px] uppercase font-medium">
        {label}
      </label>
    )}
    <select
      className={`
        w-full bg-black border border-neutral-800 p-2 
        text-neutral-200 text-xs focus:border-red-700 focus:outline-none
        ${className}
      `}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);