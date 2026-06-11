import type { ReactNode } from 'react';

interface DataCardProps {
  title: string;
  meta?: string;
  children: ReactNode;
}

export function DataCard({ title, meta, children }: DataCardProps) {
  return (
    <article className="data-card">
      <div className="data-card__heading">
        <h3>{title}</h3>
        {meta ? <span>{meta}</span> : null}
      </div>
      {children}
    </article>
  );
}
