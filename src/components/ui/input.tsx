import * as React from "react"

import { cn } from "@/lib/utils"

/* GO input. BRAND.md section 5: radius 12, 1.5px line border, white fill.
   Focus moves the border to charcoal. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-[15px] text-[15px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-charcoal disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
