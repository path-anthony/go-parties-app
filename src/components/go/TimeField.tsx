import { Input } from "@/components/ui/input"
import { GoLabel } from "@/components/go/GoLabel"
import { TIME_MAX, TIME_MIN, TIME_RANGE_TEXT, TIME_STEP_SECONDS, timeInRange } from "@/data/catalog"

/* What time: a real time input, quarter-hour steps, bounded to business
   hours. Optional; blank means the time is settled by text later. The setup
   hint sits under it in the muted register and blocks nothing. A time outside
   hours is said plainly, and the screen holds its Next until it is fixed. */
export function TimeField({ value, onChange }: { value: string | null; onChange: (hhmm: string | null) => void }) {
  const outOfRange = value !== null && !timeInRange(value)
  return (
    <div>
      <GoLabel className="mb-2">What time</GoLabel>
      <Input
        type="time"
        aria-label="Start time"
        min={TIME_MIN}
        max={TIME_MAX}
        step={TIME_STEP_SECONDS}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
      {outOfRange ? (
        <p className="mt-1.5 text-small text-charcoal">We book between {TIME_RANGE_TEXT}. Pick a time in that window.</p>
      ) : (
        <>
          <p className="mt-1.5 text-small text-muted">Leave it blank and we'll settle the time by text.</p>
          <p className="mt-1 text-small text-muted">Consider booking about an hour before you need it, for setup.</p>
        </>
      )}
    </div>
  )
}
