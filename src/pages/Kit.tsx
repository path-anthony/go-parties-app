import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AppShell, Body } from "@/components/go/AppShell"
import { Progress } from "@/components/go/Progress"
import { GoLabel } from "@/components/go/GoLabel"
import { Chip } from "@/components/go/Chip"
import { MonthCalendar } from "@/components/go/DatePicker"
import { TimeField } from "@/components/go/TimeField"
import { ImagePlaceholder } from "@/components/go/ImagePlaceholder"
import { Logo } from "@/components/go/Logo"
import { Thumb } from "@/components/go/Thumb"

/* Design kit. Every shared piece the screens use, from the same source
   files, after Block S1: no icons anywhere, one image placeholder, the
   badge logo, text buttons. Keep it current. */

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

export default function Kit() {
  const [month, setMonth] = useState(0)
  const [day, setDay] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [on, setOn] = useState(true)
  return (
    <AppShell>
      <Body>
        <GoLabel>Design kit</GoLabel>
        <h1 className="mt-1.5 text-hero text-charcoal">Every piece, one source.</h1>

        <GoLabel className="mt-6">Logo</GoLabel>
        <div className="mt-2 flex items-center gap-4">
          <Logo />
          <Logo text={false} />
        </div>

        <GoLabel className="mt-6">Color</GoLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SWATCHES.map(([name, hex, use]) => (
            <div key={name} className="flex items-center gap-2.5 rounded-[12px] border border-line bg-white p-2">
              <span className="size-9 flex-none rounded-[8px] border border-line" style={{ background: hex }} />
              <span className="min-w-0">
                <b className="block text-[12.5px] text-charcoal">{name}</b>
                <small className="block text-[11px] text-muted">
                  {hex} · {use}
                </small>
              </span>
            </div>
          ))}
        </div>

        <GoLabel className="mt-6">Type</GoLabel>
        <p className="mt-2 text-hero text-charcoal">Hero 32/900</p>
        <p className="text-section text-charcoal">Section 20/800</p>
        <p className="text-body text-charcoal-soft">Body 14.5/400, 1.55</p>
        <p className="text-small text-muted">Small 12</p>

        <GoLabel className="mt-6">Buttons</GoLabel>
        <div className="mt-2 grid gap-2">
          <Button>Primary</Button>
          <Button variant="dark">Dark</Button>
          <Button variant="ghost">Ghost</Button>
          <div className="flex gap-2">
            <Button size="sm">Small</Button>
            <Button size="sm" variant="dark">Small dark</Button>
            <Button size="sm" variant="ghost">Small ghost</Button>
          </div>
        </div>

        <GoLabel className="mt-6">Inputs</GoLabel>
        <div className="mt-2 grid gap-2">
          <Input placeholder="Sarah Lin" />
          <div className="flex items-center justify-between rounded-[14px] border border-line bg-white px-3.5 py-[13px] text-sm font-semibold text-charcoal">
            A switch
            <Switch checked={on} onCheckedChange={setOn} />
          </div>
          <TimeField value={time} onChange={setTime} />
        </div>

        <GoLabel className="mt-6">Chips</GoLabel>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Chip selected>25</Chip>
          <Chip sub="people">50</Chip>
          <Chip>100</Chip>
        </div>

        <GoLabel className="mt-6">Progress</GoLabel>
        <div className="mt-2">
          <Progress step={2} />
        </div>

        <GoLabel className="mt-6">Calendar</GoLabel>
        <MonthCalendar month={month} onMonth={setMonth} selected={day} onPick={setDay} />

        <GoLabel className="mt-6">Images</GoLabel>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <ImagePlaceholder className="aspect-square rounded-[10px]" />
          <ImagePlaceholder className="aspect-[3/2] rounded-[10px]" />
          <Thumb src={null} className="size-14" />
        </div>
        <p className="mt-1.5 text-small text-muted">The one placeholder: light warm grey, a grey mountain and sun, no text.</p>
      </Body>
    </AppShell>
  )
}
