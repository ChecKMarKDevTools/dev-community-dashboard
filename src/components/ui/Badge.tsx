import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-brand-500 text-white hover:bg-brand-600":
            variant === "default",
          "border-transparent bg-brand-100 text-brand-900 hover:bg-brand-200":
            variant === "secondary",
          "border-transparent bg-danger-500 text-white hover:bg-danger-600":
            variant === "destructive",
          "text-foreground": variant === "outline",
          "border-transparent bg-success-500 text-white hover:bg-success-600":
            variant === "success",
          "border-transparent bg-warning-500 text-white hover:bg-warning-600":
            variant === "warning",
        },
        className,
      )}
      {...props}
    />
  );
}
