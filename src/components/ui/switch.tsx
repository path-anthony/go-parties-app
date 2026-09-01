import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* GO switch. 44x26 track per the reference, line at rest, orange when on.
   The switch is the screen's one orange element where it appears on. */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[26px] w-[44px] shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-2 focus-visible:ring-charcoal/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-orange data-[state=unchecked]:bg-line",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[20px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-transform data-[state=checked]:translate-x-[21px] data-[state=unchecked]:translate-x-[3px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
