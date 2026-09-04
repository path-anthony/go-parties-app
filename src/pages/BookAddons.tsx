import { Navigate, useNavigate } from "react-router-dom"
import { AppShell, Body } from "@/components/go/AppShell"
import { GoLabel } from "@/components/go/GoLabel"
import { CategoryChips } from "@/components/go/CategoryChips"
import { AddonRow, StickyTotal } from "@/components/go/AddonRow"
import { ADDONS } from "@/data/catalog"
import { useBooking } from "@/state/booking"

/* Screen 8, Add-ons. SCREENS.md: category chips, add-on rows with plus,
   sticky total bar above nav. */

export default function BookAddons() {
  const navigate = useNavigate()
  const b = useBooking()

  if (!b.occ || !b.pkg) return <Navigate to="/home" replace />

  const count = Object.keys(b.addons).length
  const line = `${b.pkg.n} + ${count} add-on${count === 1 ? "" : "s"}`

  return (
    <AppShell step={4}>
      <Body>
        <GoLabel>{b.pkg.n} · Step 4 of 4</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Make it yours.</h1>
        <CategoryChips categories={Object.keys(ADDONS)} active={b.cat} onPick={(c) => b.set("cat", c)} />
        {ADDONS[b.cat].map(([name, price, plate]) => (
          <AddonRow
            key={name}
            name={name}
            cat={b.cat}
            price={price}
            plate={plate}
            selected={!!b.addons[name]}
            onToggle={() => b.toggleAddon(name, price)}
          />
        ))}
        <div className="h-[92px]" />
      </Body>
      <StickyTotal line={line} total={b.total()} action="Next" onAction={() => navigate("/book/where")} />
    </AppShell>
  )
}
