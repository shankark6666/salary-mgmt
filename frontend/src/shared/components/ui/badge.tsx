import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@shared/utils/cn";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "bg-secondary text-secondary-foreground",
      success: "bg-success-muted text-success-muted-foreground",
      warning: "bg-warning-muted text-warning-muted-foreground",
      danger: "bg-destructive-muted text-destructive-muted-foreground"
    }
  },
  defaultVariants: { tone: "neutral" }
});

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
