import type { ReactNode } from "react";

interface AlertProps {
  tone?: "error" | "warn";
  /** What happened, in a few words. */
  title: ReactNode;
  children?: ReactNode;
  /** The message of the machine, shown small under the rest. */
  detail?: string | null;
  action?: ReactNode;
}

/** Something went wrong or needs a second look: what, what it means, and what to do. */
export function Alert({ tone = "error", title, children, detail, action }: AlertProps) {
  return (
    <div className={tone === "warn" ? "alert alert-warn" : "alert"} role={tone === "warn" ? "status" : "alert"}>
      <b>{title}</b>
      {children !== undefined && <span>{children}</span>}
      {action !== undefined && <span className="end">{action}</span>}
      {detail && <span className="alert-detail">{detail}</span>}
    </div>
  );
}
