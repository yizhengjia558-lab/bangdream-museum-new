interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeading({ title, subtitle, action }: SectionHeadingProps) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 sm:mb-12">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-3 text-sm font-light tracking-wide text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
