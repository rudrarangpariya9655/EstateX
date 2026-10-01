import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Editorial heading that reveals line by line as it scrolls into view.
 * Lines are separate block spans; a space between them keeps the accessible
 * name readable ("Curated residences", not "Curatedresidences").
 */
export function RevealLines({
  lines,
  as: Tag = "h2",
  className,
  delay = 0,
  id,
}: {
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  delay?: number;
  id?: string;
}) {
  return (
    <Tag id={id} className={className} data-reveal="lines" style={{ "--reveal-delay": delay } as CSSVars}>
      {lines.map((line, i) => (
        <span key={i}>
          <span className="reveal-line">
            <span style={{ "--line": i } as CSSVars}>{line}</span>
          </span>
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

/** Generic fade-up reveal wrapper. `variant="image"` uses a clip-path wipe instead. */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  variant,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  variant?: "image";
} & Record<string, unknown>) {
  return (
    <Tag
      className={cn(className)}
      data-reveal={variant ?? ""}
      style={{ "--reveal-delay": delay } as CSSVars}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Lines that animate immediately on load (used above the fold, where scroll reveals would delay content). */
export function HeroLines({
  lines,
  as: Tag = "h1",
  className,
  startIndex = 0,
  id,
}: {
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  startIndex?: number;
  id?: string;
}) {
  return (
    <Tag id={id} className={className}>
      {lines.map((line, i) => (
        <span key={i}>
          <span className="reveal-line hero-line">
            <span style={{ "--line": i + startIndex } as CSSVars}>{line}</span>
          </span>
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
