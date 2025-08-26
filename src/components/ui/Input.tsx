// ------ src/components/ui/Input.tsx ------
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-zinc-500 mb-1 text-[10px] uppercase">
        {label}
      </label>
    )}
    <input
      className={`
        w-full bg-zinc-950 border border-zinc-800 px-2 py-0.5
        text-zinc-200 text-xs focus:border-zinc-600 focus:outline-none
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
      <label className="block text-zinc-500 mb-1 text-[10px] uppercase">
        {label}
      </label>
    )}
    <select
      className={`
        w-full bg-zinc-950 border border-zinc-800 px-2 py-0.5
        text-zinc-200 text-xs focus:border-zinc-600 focus:outline-none
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