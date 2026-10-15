import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@shared/utils/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        "aria-[invalid=true]:border-destructive",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
