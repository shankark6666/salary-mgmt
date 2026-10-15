import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@shared/utils/cn";
import { inputClasses } from "./input";

/** Native select: keyboard, screen-reader and mobile behaviour come for free. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(inputClasses, "pr-8", className)} {...props} />
  )
);
Select.displayName = "Select";
