import { cn } from "@/lib/utils"

/* Progress marker. BRAND.md section 8: four 4px bars skewed -24 degrees.
   The only diagonal in the system. */
export function Progress({ step }: { step: number }) {
  return (
    <div className="flex w-[88px] gap-[5px]">
      {[1, 2, 3, 4].map((i) => (
        <i
          key={i}
          className={cn(
            "h-1 flex-1 -skew-x-[24deg] rounded-[2px]",
            i <= step ? "bg-orange" : "bg-line"
          )}
        />
      ))}
    </div>
  )
}
