import type { LucideIcon } from 'lucide-react';

interface StatusPanelProps {
  icon: LucideIcon;
  title: string;
  value: string;
  detail: string;
}

export function StatusPanel({ icon: Icon, title, value, detail }: StatusPanelProps) {
  return (
    <article className="status-panel">
      <div className="status-panel__icon" aria-hidden="true">
        <Icon size={18} />
      </div>
      <div>
        <p className="eyebrow">{title}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}
