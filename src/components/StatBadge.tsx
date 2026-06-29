import clsx from "clsx";

export function StatBadge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={clsx("badge", className)}>{children}</span>;
}
