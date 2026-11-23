import type { ReactNode } from "react";

interface PanelProps {
  title?: ReactNode;
  /** Shown at the right end of the header. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A surface that sets one thing apart from the ground, with an optional header. */
export function Panel({ title, aside, className, children }: PanelProps) {
  return (
    <section className={className ? `panel ${className}` : "panel"}>
      {title !== undefined && (
        <header className="panel-head">
          <h2>{title}</h2>
          {aside !== undefined && <div className="panel-aside">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

interface DisclosureProps {
  title: string;
  /** Said next to the title while closed and open: what is inside. */
  hint?: ReactNode;
  children: ReactNode;
}

/** A panel that stays closed until asked for, for what only some visitors need. */
export function Disclosure({ title, hint, children }: DisclosureProps) {
  return (
    <details className="panel">
      <summary>
        {title} {hint !== undefined && <span>{hint}</span>}
      </summary>
      {children}
    </details>
  );
}
