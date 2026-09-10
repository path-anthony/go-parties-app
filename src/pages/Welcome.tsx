import { useNavigate } from "react-router-dom"
import { Calendar, Sparkle, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell, Body, Foot } from "@/components/go/AppShell"
import { HeroCarousel } from "@/components/go/HeroCarousel"

/* Screen 1, Welcome. SCREENS.md: photo plate hero 4:5, headline, body, three
   feature rows with Lucide icons, one primary button. Hero is now a real-photo
   carousel (wedding, adult party, corporate); everything below is unchanged. */

const HERO_SLIDES = [
  { src: "/photos/welcome/wedding.jpg", alt: "Wedding couple sharing a quiet moment", position: "56% center" },
  { src: "/photos/welcome/adult-party.jpg", alt: "Adult party crowd celebrating on the dance floor", position: "center" },
  { src: "/photos/welcome/corporate.jpg", alt: "Corporate event audience facing the stage", position: "center" },
]

const POINTS = [
  { Icon: Sparkle, title: "Built for you", line: "A real package, priced, in seconds" },
  { Icon: Calendar, title: "Real dates", line: "If you can pick it, we can make it" },
  { Icon: Truck, title: "Door to door", line: "Delivery, setup, the fun, teardown" },
]

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <Body>
        <HeroCarousel slides={HERO_SLIDES} eyebrow="FARMINGTON, CT" title="Party on. We'll handle it." />
        <h1 className="mt-[18px] text-hero text-charcoal">
          Your party,
          <br />
          built in <em className="text-orange not-italic">two minutes.</em>
        </h1>
        <p className="mt-2 text-body text-charcoal-soft">
          Pick the occasion. We build it from what's actually in the warehouse. You tweak it. We show up.
        </p>
        <div className="mt-[18px] grid gap-2">
          {POINTS.map(({ Icon, title, line }) => (
            <div key={title} className="flex items-center gap-3 rounded-[14px] border border-line bg-white px-3.5 py-3 text-[13.5px] font-semibold text-charcoal">
              <Icon className="size-5 flex-none stroke-orange" strokeWidth={1.75} />
              <div>
                {title}
                <small className="mt-px block text-small font-medium text-muted">{line}</small>
              </div>
            </div>
          ))}
        </div>
      </Body>
      <Foot>
        <Button onClick={() => navigate("/signin")}>Let's go</Button>
      </Foot>
    </AppShell>
  )
}
