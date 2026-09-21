import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { AddonPicker } from "@/components/go/AddonPicker"
import { fmt } from "@/data/catalog"
import { deltaOf, missingRequired, withPick, type AddonGroup, type Picks } from "@/lib/addons"

/* Browse: the moment one item with add-on groups is added, its options are
   answered right there, in a sheet named for that item (BRAND.md section 8,
   sheets never popups). Required groups hold the button until answered;
   optional ones can be left alone. The same sheet reopens from the cart to
   change a pick. */
export interface SheetItem {
  id: string
  name: string
  price: number | null
  priceUnit: string | null
  addonGroups?: AddonGroup[]
}

export function AddonSheet({
  item,
  initial,
  editing,
  onClose,
  onConfirm,
}: {
  item: SheetItem | null
  initial?: Picks
  editing?: boolean
  onClose: () => void
  onConfirm: (picks: Picks) => void
}) {
  const [picks, setPicks] = useState<Picks>({})

  useEffect(() => {
    if (item) setPicks(initial ?? {})
    // A new item (or a reopen) starts from what was already picked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id])

  const missing = item ? missingRequired(item, picks) : []
  const price = item && item.price !== null ? item.price + deltaOf({ ...item, picks }) : null

  return (
    <Drawer open={item !== null} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        {item && (
          <div className="mx-auto flex max-h-[80vh] w-full max-w-[480px] flex-col overflow-hidden px-5 pb-6">
            <DrawerTitle className="flex shrink-0 items-center justify-between gap-3 text-base font-extrabold text-charcoal">
              <span className="min-w-0 truncate">{item.name}</span>
              <DrawerClose asChild>
                <button aria-label="Close" className="p-1">
                  <X className="size-5 stroke-muted" strokeWidth={1.75} />
                </button>
              </DrawerClose>
            </DrawerTitle>
            <DrawerDescription className="shrink-0 text-small text-charcoal-soft">A couple of picks and it's in.</DrawerDescription>
            <div className="mt-3.5 flex-1 overflow-y-auto pb-px">
              <AddonPicker item={item} picks={picks} onPick={(g, a) => setPicks((prev) => withPick(prev, g, a))} />
            </div>
            <div className="mt-3.5 shrink-0">
              {missing.length > 0 && <p className="mb-2 text-small text-muted">Still needs: {missing.map((g) => g.name).join(", ")}.</p>}
              <Button className="w-full" disabled={missing.length > 0} onClick={() => onConfirm(picks)}>
                {editing ? "Save" : "Add to cart"}
                {price !== null ? ` · ${fmt(price)}` : ""}
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
