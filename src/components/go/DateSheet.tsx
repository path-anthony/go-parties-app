import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { MonthCalendar } from "@/components/go/DatePicker"
import { labelForIso } from "@/lib/availability"
import { useBooking } from "@/state/booking"
import { useStoreUi } from "@/state/store"

/* The party date, picked from the header or the menu (Block S1): the same
   month calendar as checkout, writing the booking store's date, so the
   store, the drawer, Ask GO and checkout all read one date. */
export function DateSheet() {
  const b = useBooking()
  const { dateOpen, setDateOpen } = useStoreUi()
  return (
    <Drawer open={dateOpen} onOpenChange={setDateOpen}>
      <DrawerContent className="max-h-[80vh]">
        <div className="mx-auto w-full max-w-[480px] overflow-y-auto px-5 pb-6">
          <DrawerTitle className="flex items-center justify-between text-base font-extrabold text-charcoal">
            Party date
            <DrawerClose asChild>
              <button className="min-h-[44px] px-2 text-sm font-bold text-charcoal">Close</button>
            </DrawerClose>
          </DrawerTitle>
          <p className="mt-1 text-small text-charcoal-soft">{b.itemDate ? `${labelForIso(b.itemDate)}. Tap another day to change it.` : "Tap a day. We show what's free on it."}</p>
          <MonthCalendar month={b.itemMonth} onMonth={(i) => b.set("itemMonth", i)} selected={b.itemDate} onPick={(d) => b.set("itemDate", d)} />
          <div className="mt-3 flex gap-2.5">
            {b.itemDate && (
              <Button variant="ghost" className="flex-1" onClick={() => b.set("itemDate", null)}>
                Clear date
              </Button>
            )}
            <Button variant="dark" className="flex-1" onClick={() => setDateOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
