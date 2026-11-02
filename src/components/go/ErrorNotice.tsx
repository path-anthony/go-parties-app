import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

/* The one error style (Block S2). ErrorNotice: red text on a light red
   ground with a red left rule, role="alert", placed directly above the
   button whose action failed and scrolled into view when it appears. Never
   white, grey or the normal text style. FieldError: the same red, as a
   line directly under the field it belongs to; the field itself gets
   aria-invalid, which the Input turns into a red border. Success and
   information keep their own quiet styles. */

export function ErrorNotice({ children, className, scroll = true }: { children: React.ReactNode; className?: string; scroll?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scroll) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [scroll])
  return (
    <div ref={ref} role="alert" className={cn("rounded-[12px] border-l-4 border-error bg-error-tint px-4 py-3 text-sm text-error", className)}>
      {children}
    </div>
  )
}

export function FieldError({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <p id={id} role="alert" className={cn("mt-1.5 text-small font-semibold text-error", className)}>
      {children}
    </p>
  )
}
