import * as React from "react"

import { cn } from "@/lib/utils"

/* GO input. BRAND.md section 5: radius 12, 1.5px line border, white fill.
   Focus moves the border to charcoal; aria-invalid (Block S2) turns it red,
   with the message right under the field (FieldError). */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-[12px] border-[1.5px] border-line bg-white px-3.5 py-[14px] text-[16px] text-charcoal transition-colors outline-none placeholder:text-muted focus:border-charcoal aria-invalid:border-error aria-invalid:focus:border-error disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
