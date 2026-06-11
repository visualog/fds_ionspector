import type { ReactNode } from 'react';

interface SectionBlockProps {
  title: string;
  eyebrow: string;
  children: ReactNode;
}

export function SectionBlock({ title, eyebrow, children }: SectionBlockProps) {
  return (
    <section className="section-block">
      <div className="section-block__heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
