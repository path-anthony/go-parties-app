import { useState } from "react"
import { Calendar, Check, Home, MapPin, Plus, Sparkle, Truck, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { PhotoPlate, PlateText } from "@/components/go/PhotoPlate"
import { Wordmark } from "@/components/go/Wordmark"
import { Progress } from "@/components/go/Progress"
import { GoLabel } from "@/components/go/GoLabel"
import { Chip } from "@/components/go/Chip"
import { MonthChips, DayCarousel, Reveal } from "@/components/go/DatePicker"
import { OccasionCard } from "@/components/go/OccasionCard"
import { RailCard } from "@/components/go/RailCard"
import { Rail } from "@/components/go/Rail"
import { PackageHero } from "@/components/go/PackageHero"
import { PackageSelect } from "@/components/go/PackageSelect"
import { ItemRow, SwapList } from "@/components/go/ItemRow"
import { AddonRow, StickyTotal } from "@/components/go/AddonRow"
import { CategoryChips } from "@/components/go/CategoryChips"
import { AiLine } from "@/components/go/AiLine"
import { BottomNav } from "@/components/go/BottomNav"
import { daysFor } from "@/lib/availability"
import { ADDONS, BUDGETS, GUESTS, NEXT_OPEN, OCC, PKGS, TIMES, occOf } from "@/data/catalog"

/* Design kit. Every component from BRAND.md section 8, rendered from the same
   source files the screens use. Keep it current. */

const SWATCHES: [name: string, hex: string, use: string][] = [
  ["Cream", "#F9F7F3", "ground"],
  ["White", "#FFFFFF", "cards, nav"],
  ["Line", "#E8E2D9", "borders"],
  ["Charcoal", "#211D1C", "headlines, dark button"],
  ["Charcoal soft", "#4A4340", "body"],
  ["Muted", "#8C847C", "secondary, 12px+ only"],
  ["Taupe", "#8B7355", "labels only"],
  ["Orange", "#F49B1F", "the one accent"],
  ["Orange deep", "#D9820A", "hover"],
  ["Orange tint", "#FDF1E0", "selected"],
  ["Good", "#3E8E4A", "open, paid, held"],
]

const ICONS = [
  { name: "Home", Icon: Home },
  { name: "Calendar", Icon: Calendar },
  { name: "Sparkle", Icon: Sparkle },
  { name: "User", Icon: User },
  { name: "Check", Icon: Check },
  { name: "Plus", Icon: Plus },
  { name: "X", Icon: X },
  { name: "MapPin", Icon: MapPin },
  { name: "Truck", Icon: Truck },
]

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="pt-10">
      <div className="flex items-center gap-3">
        <i className="inline-block h-[3px] w-[30px] -skew-x-[24deg] bg-orange" />
        <GoLabel>{label}</GoLabel>
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-[-.01em] text-charcoal">{title}</h2>
      <div className="mt-3.5">{children}</div>
    </section>
  )
}

export default function Kit() {
  const { toast } = useToast()
  const splash = PKGS.kids[3]
  const [month, setMonth] = useState(0)
  const [day, setDay] = useState<string | null>("Sep 13")
  const [time, setTime] = useState<string | null>("Midday")
  const [guests, setGuests] = useState<string | null>("20-25")
  const [budget, setBudget] = useState<number | null>(2000)
  const [swapOpen, setSwapOpen] = useState(false)
  const [swapped, setSwapped] = useState("Big Wave water slide")
  const [addons, setAddons] = useState<Record<string, number>>({ "Snow Cone Station": 199 })
  const [power, setPower] = useState(true)
  const recs = [PKGS.kids[3], PKGS.kids[2], PKGS.adult[3], PKGS.wedding[1]]

  return (
    <div className="mx-auto max-w-[480px] px-5 pb-20 min-[900px]:max-w-[560px]">
      <div className="flex items-center justify-between border-b border-line pt-[18px] pb-3">
        <Wordmark />
        <span className="text-small font-semibold text-muted">Design kit</span>
      </div>

      <Section label="01" title="Palette">
        <div className="grid grid-cols-2 gap-2.5">
          {SWATCHES.map(([name, hex, use]) => (
            <div key={name} className="overflow-hidden rounded-[12px] border border-line bg-white">
              <i className="block h-[58px] border-b border-line" style={{ background: hex }} />
              <div className="px-[11px] py-[9px] text-[11px] text-muted">
                <b className="block text-[12.5px] text-charcoal">{name}</b>
                {hex} · {use}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section label="02" title="Type">
        <div className="grid gap-0">
          {[
            ["HERO · 900 · 32", <span key="h" className="text-hero text-charcoal">Your party, built in <em className="text-orange not-italic">two minutes.</em></span>],
            ["SCREEN · 900 · 26", <span key="s" className="text-screen text-charcoal">What are we celebrating?</span>],
            ["SECTION · 800 · 20", <span key="se" className="text-section text-charcoal">Recommended for you</span>],
            ["PRICE · 900 · 22", <span key="p" className="text-price text-charcoal">$1,899</span>],
            ["CARD · 700 · 14", <span key="c" className="text-card text-charcoal">Big Splash</span>],
            ["BODY · 400 · 14.5", <span key="b" className="text-body text-charcoal-soft">Pick the occasion. We build it from what's actually in the warehouse. You tweak it. We show up.</span>],
            ["LABEL · 700 · 11", <GoLabel key="l">Step 1 of 4</GoLabel>],
            ["SMALL · 400 · 12", <span key="sm" className="text-small text-muted">Grayed days are booked solid, crew and gear included.</span>],
          ].map(([label, node], i) => (
            <div key={i} className="grid grid-cols-[110px_1fr] items-baseline gap-3 border-b border-line py-2.5">
              <small className="text-[11px] font-semibold text-muted">{label}</small>
              {node}
            </div>
          ))}
        </div>
      </Section>

      <Section label="03" title="Photo plates">
        <PhotoPlate spec="MEL · 00 · HERO · 4:5" className="aspect-[4/5]">
          <PlateText eyebrow="FARMINGTON, CT" title="Party on. We'll handle it." />
        </PhotoPlate>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <PhotoPlate spec="MEL · 01 · BACKYARD WIDE · 5:4" className="aspect-[5/4]"><PlateText title="Default" /></PhotoPlate>
          <PhotoPlate variant="warm" spec="MEL · 02 · GOLDEN HOUR · 5:4" className="aspect-[5/4]"><PlateText title="Warm" /></PhotoPlate>
          <PhotoPlate variant="cool" spec="MEL · 03 · WATER SLIDE · 5:4" className="aspect-[5/4]"><PlateText title="Cool" /></PhotoPlate>
          <PhotoPlate variant="stone" spec="MEL · 04 · EVENING SET · 5:4" className="aspect-[5/4]"><PlateText title="Stone" /></PhotoPlate>
        </div>
        <p className="mt-2.5 text-small text-muted">Spec lines are Mel's shot list. Swapping a plate for a photo changes one file.</p>
      </Section>

      <Section label="04" title="Icons">
        <div className="flex flex-wrap gap-3">
          {ICONS.map(({ name, Icon }) => (
            <div key={name} className="flex w-[76px] flex-col items-center gap-2 rounded-[12px] border border-line bg-white px-3 py-3.5 text-[10.5px] font-semibold text-muted">
              <Icon className="size-[22px] stroke-charcoal" strokeWidth={1.75} />
              {name}
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-small text-muted">Lucide only. Stroke 1.75. Charcoal at rest, orange when active, muted in the nav.</p>
      </Section>

      <Section label="05" title="Buttons">
        <div className="grid gap-2.5">
          <Button className="w-full">Let's go</Button>
          <Button variant="dark" className="w-full">Hold my date, $200</Button>
          <Button variant="ghost" className="w-full">Back</Button>
          <div><Button size="sm">Show me</Button></div>
        </div>
      </Section>

      <Section label="06" title="Input">
        <GoLabel className="mb-1.5">Email</GoLabel>
        <Input placeholder="you@email.com" />
      </Section>

      <Section label="07" title="Chips">
        <GoLabel className="mb-2">What time</GoLabel>
        <div className="grid grid-cols-3 gap-2">
          {TIMES.kids.map(([label, t]) => (
            <Chip key={label} selected={time === label} sub={t} onClick={() => setTime(label)}>{label}</Chip>
          ))}
        </div>
        <GoLabel className="mt-5 mb-2">How many people</GoLabel>
        <div className="grid grid-cols-3 gap-2">
          {GUESTS.kids.map((g) => (
            <Chip key={g} selected={guests === g} onClick={() => setGuests(g)}>{g}</Chip>
          ))}
        </div>
        <GoLabel className="mt-5 mb-2">Ballpark</GoLabel>
        <div className="grid grid-cols-2 gap-2">
          {BUDGETS.kids.map(([label, v]) => (
            <Chip key={label} selected={budget === v} className="px-2 py-4" onClick={() => setBudget(v)}>{label}</Chip>
          ))}
        </div>
      </Section>

      <Section label="08" title="Month chips and day carousel">
        <MonthChips active={month} onPick={(i) => { setMonth(i); setDay(null); setTime(null) }} />
        <DayCarousel days={daysFor(month, "kids")} selected={day} onPick={setDay} />
        <div className="mt-1 flex items-center gap-2.5 text-[11.5px] text-muted">
          <i className="inline-block size-1.5 rounded-full bg-good" />
          Open. Grayed days are booked solid, crew and gear included.
        </div>
        <Reveal open={!!day} className="mt-3.5">
          <GoLabel className="mb-2">What time</GoLabel>
          <div className="grid grid-cols-3 gap-2">
            {TIMES.kids.map(([label, t]) => (
              <Chip key={label} selected={time === label} sub={t} onClick={() => setTime(label)}>{label}</Chip>
            ))}
          </div>
        </Reveal>
      </Section>

      <Section label="09" title="Occasion cards">
        <div className="grid grid-cols-2 gap-2.5">
          {(Object.keys(OCC) as (keyof typeof OCC)[]).map((id) => (
            <OccasionCard key={id} label={OCC[id].label} plate={OCC[id].plate} />
          ))}
        </div>
      </Section>

      <Section label="10" title="Recommended rail">
        <Rail>
          {recs.map((p) => (
            <RailCard key={p.id} pkg={p} nextOpen={NEXT_OPEN[occOf(p)]} />
          ))}
        </Rail>
      </Section>

      <Section label="11" title="Package hero and select">
        <PackageHero pkg={splash} meta="Sat Sep 13 · Midday · 20-25 people" />
        <PackageSelect pkgs={PKGS.kids} value={splash.id} onChange={() => {}} />
      </Section>

      <Section label="12" title="Item row and Swap">
        <ItemRow
          name={swapped}
          cat="Inflatable"
          plate=""
          swappable
          swapOpen={swapOpen}
          onToggleSwap={() => setSwapOpen(!swapOpen)}
        />
        <SwapList
          open={swapOpen}
          options={["Big Wave water slide", "Bounce/slide combo", "Dual lane slide (+$200)"]}
          current={swapped}
          onPick={(o) => { setSwapped(o); setSwapOpen(false); toast({ title: "Swapped." }) }}
        />
      </Section>

      <Section label="13" title="Add-on rows and sticky total">
        <CategoryChips categories={Object.keys(ADDONS)} active="Fun foods" onPick={() => {}} />
        {ADDONS["Fun foods"].slice(0, 3).map(([name, price, plate]) => (
          <AddonRow
            key={name}
            name={name}
            cat="Fun foods"
            price={price}
            plate={plate}
            selected={!!addons[name]}
            onToggle={() =>
              setAddons((a) => {
                const next = { ...a }
                if (next[name]) delete next[name]
                else next[name] = price
                return next
              })
            }
          />
        ))}
        <div className="[&>div]:static [&>div]:p-0">
          <StickyTotal
            line={`Big Splash + ${Object.keys(addons).length} add-on${Object.keys(addons).length === 1 ? "" : "s"}`}
            total={splash.p + Object.values(addons).reduce((a, b) => a + b, 0)}
            action="Next"
            onAction={() => {}}
          />
        </div>
      </Section>

      <Section label="14" title="Switch">
        <div className="flex items-center justify-between rounded-[14px] border border-line bg-white px-3.5 py-[13px] text-sm font-semibold text-charcoal">
          <div>
            Power outlet within 100 ft
            <small className="block text-[11.5px] font-medium text-muted">Blowers and stations need it</small>
          </div>
          <Switch checked={power} onCheckedChange={setPower} />
        </div>
      </Section>

      <Section label="15" title="Sheet">
        <Drawer>
          <DrawerTrigger asChild>
            <div><AiLine prompt="Not sure? Describe the party" /></div>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-[480px] px-5 pb-6">
              <DrawerTitle className="flex items-center justify-between text-base font-extrabold text-charcoal">
                <span className="flex items-center gap-2">
                  <Sparkle className="size-[18px] stroke-orange" strokeWidth={1.75} />
                  What's the vibe?
                </span>
                <DrawerClose asChild>
                  <button aria-label="Close"><X className="size-5 stroke-muted" strokeWidth={1.75} /></button>
                </DrawerClose>
              </DrawerTitle>
              <div className="mt-2.5 rounded-[12px] border border-line bg-cream px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                Tell me the party. I'll build it.
              </div>
              <div className="mt-2.5 ml-[30px] rounded-[12px] border border-orange bg-orange-tint px-3.5 py-3 text-[13.5px] leading-normal text-charcoal">
                Backyard bday, 25 kids, about $1,500
              </div>
              <p className="mt-3 text-small text-muted">Scripted in this build. Live version runs on Claude.</p>
            </div>
          </DrawerContent>
        </Drawer>
      </Section>

      <Section label="16" title="Progress marker">
        <Progress step={2} />
      </Section>

      <Section label="17" title="Toast">
        <Button variant="ghost" onClick={() => toast({ title: "Held. You're good." })}>Show a toast</Button>
      </Section>

      <Section label="18" title="Bottom nav">
        <div className="overflow-hidden rounded-[14px] border border-line [&>nav]:static [&>nav]:border-t-0">
          <BottomNav active="home" onPick={() => {}} />
        </div>
      </Section>

      <Toaster />
    </div>
  )
}
