import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassCard({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass rounded-3xl p-4", className)} {...rest}>
      {children}
    </div>
  );
}
