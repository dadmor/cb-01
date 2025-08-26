// ------ src/components/ui/Card.tsx ------
interface CardProps {
  title?: string;
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, selected, className = '' }) => (
  <div className={`
    bg-zinc-900 border rounded
    ${selected ? 'border-orange-500' : 'border-zinc-800'}
    ${className}
  `}>
    {title && (
      <div className="h-6 bg-zinc-800 border-b border-zinc-700 px-2 flex items-center">
        <span className="text-xs text-zinc-400 uppercase tracking-wider">{title}</span>
      </div>
    )}
    <div className="p-2">{children}</div>
  </div>
);
