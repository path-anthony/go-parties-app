import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* GO buttons. BRAND.md section 8: primary orange, dark charcoal, ghost white
   with line border. 15px/800, padding 15x22, radius 12. One primary per screen. */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[12px] whitespace-nowrap transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-charcoal/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[.985] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-orange text-charcoal font-extrabold hover:bg-orange-deep",
        dark: "bg-charcoal text-white font-extrabold hover:bg-charcoal-soft",
        ghost:
          "bg-white text-charcoal font-bold border-[1.5px] border-line hover:border-charcoal",
      },
      size: {
        default: "px-[22px] py-[15px] text-[15px]",
        sm: "rounded-[9px] px-[14px] py-[9px] text-[12.5px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
