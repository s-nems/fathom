import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "default" | "primary" | "ghost";
type Size = "sm" | "md" | "lg";

interface Look {
  variant?: Variant;
  size?: Size;
}

const classOf = ({ variant = "default", size = "md" }: Look, extra?: string): string =>
  ["btn", variant !== "default" && `btn-${variant}`, size !== "md" && `btn-${size}`, extra].filter(Boolean).join(" ");

/** The one button of the app. Primary is for the single action a screen is about. */
export function Button({ variant, size, className, ...rest }: Look & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={classOf({ variant, size }, className)} {...rest} />;
}

/** A link that looks like a button, for an action that leads to another view. */
export function ButtonLink({ variant, size, className, ...rest }: Look & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={classOf({ variant, size }, className)} {...rest} />;
}
