import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassCard({
  className,
  children,
  variant = "card",
  ...rest
}: { className?: string; children: ReactNode; variant?: "card" | "low" | "glass" } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl p-6 shadow-card",
        variant === "card" && "bg-card",
        variant === "low" && "surface-low shadow-none",
        variant === "glass" && "glass",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
